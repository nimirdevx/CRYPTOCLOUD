import uuid
import boto3
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..models.user_model import User
from ..models.file_model import FileMetadata, FileMetadataResponse
from ..utils.auth import get_current_user
from ..db import get_file_collection
from ..config import settings
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId

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
    parentId: Optional[str] = None

class DownloadResponse(BaseModel):
    download_url: str

class RenameRequest(BaseModel):
    new_filename: str

class CreateFolderRequest(BaseModel): # 4. NEW model for creating folders
    name: str
    parentId: Optional[str] = None

class StorageUsageResponse(BaseModel):
    used: int
    quota: int


async def recursive_delete(file_id: ObjectId, user_id: ObjectId, files: AsyncIOMotorCollection):
    """
    Helper function to recursively delete folders and files.
    """
    file_doc = await files.find_one({"_id": file_id, "owner_id": user_id})
    if not file_doc:
        return # File already gone or doesn't belong to user

    if file_doc.get("isFolder", False):
        # It's a folder, delete all its children first
        children = await files.find({"parentId": file_id, "owner_id": user_id}).to_list(length=None)
        for child in children:
            await recursive_delete(child["_id"], user_id, files)
    else:
        # It's a file, delete it from S3
        s3_key = file_doc["file_path"]
        if s3_key: # Only try to delete if there's an S3 key
            try:
                s3_client.delete_object(
                    Bucket=settings.s3_bucket_name,
                    Key=s3_key
                )
            except Exception as e:
                # Log the error but don't stop the database cleanup
                print(f"Error deleting S3 object {s3_key}: {e}")

    # Finally, delete the item itself from MongoDB
    await files.delete_one({"_id": file_id, "owner_id": user_id})

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

# --- NEW: CREATE FOLDER ENDPOINT ---
@router.post("/folders", response_model=FileMetadataResponse)
async def create_folder(
    request: CreateFolderRequest,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Creates a new folder in the database.
    A "folder" is just a FileMetadata doc with isFolder=True.
    """
    parent_obj_id = None
    if request.parentId:
        try:
            parent_obj_id = ObjectId(request.parentId)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid parentId format")

    folder_metadata = {
        "filename": request.name,
        "owner_id": current_user.id,
        "upload_time": datetime.utcnow(),
        "file_path": "",  # Folders don't have an S3 path
        "file_size": 0,     # Folders have 0 size
        "isFolder": True,
        "parentId": parent_obj_id
    }
    
    new_folder = await files.insert_one(folder_metadata)
    created_folder = await files.find_one({"_id": new_folder.inserted_id})
    
    return FileMetadataResponse(
        id=str(created_folder["_id"]),
        filename=created_folder["filename"],
        owner_id=str(created_folder["owner_id"]),
        upload_time=created_folder["upload_time"].isoformat(),
        file_size=created_folder["file_size"],
        isFolder=created_folder["isFolder"],
        parentId=str(created_folder["parentId"]) if created_folder["parentId"] else None
    )
    
# --- NEW: FINALIZE UPLOAD ---
@router.post("/finalize-upload", response_model=FileMetadataResponse)
async def finalize_upload(
    request: FinalizeRequest,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    parent_obj_id = None
    if request.parentId:
        try:
            parent_obj_id = ObjectId(request.parentId)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid parentId format")
            
    file_metadata = {
        "filename": request.filename,
        "owner_id": current_user.id,
        "file_path": request.s3_key,
        "upload_time": datetime.utcnow(),
        "file_size": request.file_size,
        "isFolder": False, # Files are not folders
        "parentId": parent_obj_id # Set the parent folder
    }
    
    new_file = await files.insert_one(file_metadata)
    created_file = await files.find_one({"_id": new_file.inserted_id})
    
    # ... (return FileMetadataResponse with new fields)
    return FileMetadataResponse(
        id=str(created_file["_id"]),
        filename=created_file["filename"],
        owner_id=str(created_file["owner_id"]),
        upload_time=created_file["upload_time"].isoformat(),
        file_size=created_file["file_size"],
        isFolder=created_file["isFolder"],
        parentId=str(created_file["parentId"]) if created_file["parentId"] else None
    )

# --- UNCHANGED: LIST FILES ---
# This endpoint works perfectly as-is! It just reads from Mongo.
@router.get("/", response_model=List[FileMetadataResponse])
async def list_items(
    parentId: Optional[str] = None, # 5. Add parentId query parameter
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    query = {"owner_id": current_user.id}
    
    if parentId:
        try:
            query["parentId"] = ObjectId(parentId)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid parentId format")
    else:
        query["parentId"] = None # Root directory

    user_files = await files.find(query).to_list(length=None)
    
    response_list = []
    for f in user_files:
        response_list.append(
            FileMetadataResponse(
                id=str(f["_id"]),
                filename=f["filename"],
                owner_id=str(f["owner_id"]),
                upload_time=f["upload_time"].isoformat(),
                file_size=f.get("file_size", 0),
                isFolder=f.get("isFolder", False),
                parentId=str(f["parentId"]) if f.get("parentId") else None
            )
        )
    return response_list

@router.get("/download-url/{file_id}", response_model=DownloadResponse)
async def get_download_url(
    file_id: str,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Client asks for a URL to download a file from.
    """
    try:
        obj_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID format")

    file_metadata = await files.find_one({"_id": obj_id})

    if not file_metadata or file_metadata["owner_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="File not found or access denied")
        
    if file_metadata.get("isFolder", False):
        raise HTTPException(status_code=400, detail="Cannot download a folder")

    s3_key = file_metadata["file_path"]

    try:
        download_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.s3_bucket_name,
                'Key': s3_key,
                'ResponseContentDisposition': f'attachment; filename="{file_metadata["filename"]}"'
            },
            ExpiresIn=3600
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not generate download URL: {e}")

    return DownloadResponse(download_url=download_url)

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    file_id: str,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Deletes a file or folder (recursively) from S3 and its metadata from MongoDB.
    """
    try:
        obj_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID format")

    # Start the recursive delete
    await recursive_delete(obj_id, current_user.id, files)
    
    return

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

@router.patch("/{file_id}", response_model=FileMetadataResponse)
async def rename_item(
    file_id: str,
    request: RenameRequest,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Renames a file or folder.
    """
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

    # Add new fields to the response
    return FileMetadataResponse(
        id=str(updated_file["_id"]),
        filename=updated_file["filename"],
        owner_id=str(updated_file["owner_id"]),
        upload_time=updated_file["upload_time"].isoformat(),
        file_size=updated_file.get("file_size", 0),
        isFolder=updated_file.get("isFolder", False),
        parentId=str(updated_file["parentId"]) if updated_file.get("parentId") else None
    )