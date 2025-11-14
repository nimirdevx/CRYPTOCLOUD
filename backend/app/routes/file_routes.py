import uuid
import boto3
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
from datetime import datetime

from ..models.user_model import User
from ..models.file_model import FileMetadata, FileMetadataResponse
from ..utils.auth import get_current_user
from ..db import get_file_collection
from ..config import settings
from motor.motor_asyncio import AsyncIOMotorCollection

# --- NEW S3 SETUP ---
router = APIRouter()
s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.s3_region
)

# --- NEW Pydantic Models for our new routes ---
class UploadRequest(BaseModel):
    filename: str
    content_type: str

class UploadResponse(BaseModel):
    upload_url: str
    s3_key: str  # We'll call the file path in S3 the 's3_key'

class FinalizeRequest(BaseModel):
    filename: str
    s3_key: str
    file_size: int

class DownloadResponse(BaseModel):
    download_url: str

class RenameRequest(BaseModel):
    new_filename: str

# --- NEW: REQUEST UPLOAD URL ---
@router.post("/request-upload-url", response_model=UploadResponse)
async def request_upload_url(
    request: UploadRequest,
    current_user: User = Depends(get_current_user)
):
    """
    First step of upload. Client asks for a URL to upload to.
    """
    # Generate a unique key (path) for the file in S3
    s3_key = f"{current_user.id}/{uuid.uuid4()}-{request.filename}"
    
    try:
        # Generate the presigned URL for a PUT request
        upload_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': settings.s3_bucket_name,
                'Key': s3_key,
                'ContentType': request.content_type
            },
            ExpiresIn=3600  # URL is valid for 1 hour
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not generate upload URL: {e}")
        
    return UploadResponse(upload_url=upload_url, s3_key=s3_key)

# --- NEW: FINALIZE UPLOAD ---
@router.post("/finalize-upload", response_model=FileMetadataResponse)
async def finalize_upload(
    request: FinalizeRequest,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Second step of upload. Client confirms the upload was successful.
    We now save the metadata to MongoDB.
    """
    file_metadata = {
        "filename": request.filename,
        "owner_id": current_user.id,
        "file_path": request.s3_key,  # We reuse 'file_path' to store the S3 key
        "upload_time": datetime.utcnow(),
        "file_size": request.file_size
    }
    
    new_file = await files.insert_one(file_metadata)
    created_file = await files.find_one({"_id": new_file.inserted_id})
    
    return FileMetadataResponse(
        id=str(created_file["_id"]),
        filename=created_file["filename"],
        owner_id=str(created_file["owner_id"]),
        upload_time=created_file["upload_time"].isoformat(),
        file_size=created_file["file_size"]
    )

# --- UNCHANGED: LIST FILES ---
# This endpoint works perfectly as-is! It just reads from Mongo.
@router.get("/", response_model=List[FileMetadataResponse])
async def list_files(
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    user_files = await files.find({"owner_id": current_user.id}).to_list(length=None)
    
    response_list = []
    for f in user_files:
        response_list.append(
            FileMetadataResponse(
                id=str(f["_id"]),
                filename=f["filename"],
                owner_id=str(f["owner_id"]),
                upload_time=f["upload_time"].isoformat(),
                file_size=f.get("file_size", 0)  # Default to 0 if not present
            )
        )
    return response_list

# --- NEW: GET DOWNLOAD URL ---
@router.get("/download-url/{file_id}", response_model=DownloadResponse)
async def get_download_url(
    file_id: str,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Client asks for a URL to download a file from.
    """
    from bson import ObjectId
    try:
        obj_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID format")

    file_metadata = await files.find_one({"_id": obj_id})

    # Security check: Ensure the user owns this file
    if not file_metadata or file_metadata["owner_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    s3_key = file_metadata["file_path"] # Get the S3 key from our db

    try:
        # Generate the presigned URL for a GET request
        download_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.s3_bucket_name,
                'Key': s3_key,
                'ResponseContentDisposition': f'attachment; filename="{file_metadata["filename"]}"'
            },
            ExpiresIn=3600  # URL is valid for 1 hour
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not generate download URL: {e}")

    return DownloadResponse(download_url=download_url)

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Deletes a file from S3 and its metadata from MongoDB.
    """
    from bson import ObjectId
    try:
        obj_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID format")

    # 1. Find the file metadata in the database
    file_metadata = await files.find_one({"_id": obj_id})

    # 2. Security Check: Ensure the user owns this file
    if not file_metadata or file_metadata["owner_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    s3_key = file_metadata["file_path"] # Get the S3 key

    # 3. Delete the file from S3
    try:
        s3_client.delete_object(
            Bucket=settings.s3_bucket_name,
            Key=s3_key
        )
    except Exception as e:
        # If S3 fails, we stop. We don't want to delete the metadata
        # for a file that still exists.
        raise HTTPException(status_code=500, detail=f"Could not delete file from S3: {e}")

    # 4. Delete the file metadata from MongoDB
    await files.delete_one({"_id": obj_id})
    
    # Return 204 No Content (success)
    return

class StorageUsageResponse(BaseModel):
    used: int
    quota: int

@router.get("/users/me/storage", response_model=StorageUsageResponse)
async def get_storage_usage(
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Calculates the total storage used by the current user.
    """
    # Define a user quota (e.g., 5GB)
    USER_QUOTA_BYTES = 5 * 1024 * 1024 * 1024  # 5 GB

    # Use a MongoDB aggregation pipeline to sum file sizes
    pipeline = [
        {"$match": {"owner_id": current_user.id}},
        {"$group": {"_id": None, "total_usage": {"$sum": "$file_size"}}}
    ]
    
    result = await files.aggregate(pipeline).to_list(length=1)
    
    total_usage = 0
    if result:
        total_usage = result[0].get("total_usage", 0)

    return StorageUsageResponse(used=total_usage, quota=USER_QUOTA_BYTES)

# --- NEW: RENAME FILE ENDPOINT ---
@router.patch("/{file_id}", response_model=FileMetadataResponse)
async def rename_file(
    file_id: str,
    request: RenameRequest,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    from bson import ObjectId
    try:
        obj_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID format")

    # Find the file
    file_metadata = await files.find_one({"_id": obj_id})

    # Security Check
    if not file_metadata or file_metadata["owner_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    # Perform the update
    await files.update_one(
        {"_id": obj_id},
        {"$set": {"filename": request.new_filename}}
    )

    # Get the updated document
    updated_file = await files.find_one({"_id": obj_id})

    return FileMetadataResponse(
        id=str(updated_file["_id"]),
        filename=updated_file["filename"],
        owner_id=str(updated_file["owner_id"]),
        upload_time=updated_file["upload_time"].isoformat(),
        file_size=updated_file.get("file_size", 0)
    )