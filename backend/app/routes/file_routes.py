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

class DownloadResponse(BaseModel):
    download_url: str

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
        "upload_time": datetime.utcnow()
    }
    
    new_file = await files.insert_one(file_metadata)
    created_file = await files.find_one({"_id": new_file.inserted_id})
    
    return FileMetadataResponse(
        id=str(created_file["_id"]),
        filename=created_file["filename"],
        owner_id=str(created_file["owner_id"]),
        upload_time=created_file["upload_time"].isoformat()
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
                upload_time=f["upload_time"].isoformat()
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