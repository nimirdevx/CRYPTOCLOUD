import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from starlette.background import BackgroundTask
from fastapi.responses import FileResponse
from datetime import datetime
from typing import List
from ..models.user_model import User
from ..models.file_model import FileMetadata, FileMetadataResponse
from ..utils.auth import get_current_user
from ..utils.crypto_utils import encrypt_data, decrypt_data
from ..db import get_file_collection
from motor.motor_asyncio import AsyncIOMotorCollection
import aiofiles

router = APIRouter()
UPLOAD_DIR = "uploads"

@router.post("/upload", response_model=FileMetadataResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, file_id)
    
    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            encrypted_content = encrypt_data(content)
            await out_file.write(encrypted_content)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not save file: {e}")

    file_metadata = {
        "filename": file.filename,
        "owner_id": current_user.id,
        "file_path": file_path,
        "upload_time": datetime.utcnow()
    }
    
    new_file = await files.insert_one(file_metadata)
    created_file = await files.find_one({"_id": new_file.inserted_id})
    
    # Manually construct the response to ensure correct types
    return FileMetadataResponse(
        id=str(created_file["_id"]),
        filename=created_file["filename"],
        owner_id=str(created_file["owner_id"]),
        upload_time=created_file["upload_time"].isoformat()
    )

@router.get("/files", response_model=List[FileMetadataResponse])
async def list_files(
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    user_files = await files.find({"owner_id": current_user.id}).to_list(length=None)
    
    # Manually construct the response list to avoid KeyErrors or ValidationErrors
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

@router.get("/download/{file_id}")
async def download_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    from bson import ObjectId
    try:
        obj_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file ID format")

    file_metadata = await files.find_one({"_id": obj_id})

    if not file_metadata or file_metadata["owner_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found or access denied")

    file_path = file_metadata["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server")

    decrypted_file_path = f"{file_path}.decrypted"
    
    try:
        async with aiofiles.open(file_path, 'rb') as in_file:
            encrypted_content = await in_file.read()
        
        decrypted_content = decrypt_data(encrypted_content)
        
        async with aiofiles.open(decrypted_file_path, 'wb') as out_file:
            await out_file.write(decrypted_content)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Decryption failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not process file: {e}")

    return FileResponse(
        path=decrypted_file_path,
        filename=file_metadata["filename"],
        media_type='application/octet-stream',
       background=BackgroundTask(os.remove, decrypted_file_path)
    )
