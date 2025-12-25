from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorCollection

from ..models.user_model import User
from ..models.public_share_model import (
    PublicShare, 
    CreatePublicShareRequest,
    PublicShareResponse,
    PublicShareMetadata,
    PublicShareListItem,
    DownloadPublicFileRequest
)
from ..utils.auth import get_current_user, get_password_hash, verify_password
from ..db import get_file_collection, get_public_shares_collection
from ..utils.file_utils import s3_client
from ..config import settings

router = APIRouter()

# ============================================================================
# AUTHENTICATED ENDPOINTS (require login)
# ============================================================================

@router.post("/files/{file_id}/public", response_model=PublicShareResponse, status_code=status.HTTP_201_CREATED)
async def create_public_link(
    file_id: str,
    request: CreatePublicShareRequest,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection),
    public_shares: AsyncIOMotorCollection = Depends(get_public_shares_collection)
):
    """
    Creates a public share link for a file.
    
    PRIVACY: No decryption keys are stored in the database.
    The frontend will append #key=xxx to the returned URL.
    """
    # 1. Verify file ownership
    try:
        obj_file_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID")
    
    file_doc = await files.find_one({"_id": obj_file_id})
    if not file_doc or file_doc["owner_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="File not found or access denied")
    
    # 2. Create public share document
    expires_at = datetime.utcnow() + timedelta(hours=request.expires_in_hours)
    
    share_doc = PublicShare(
        file_id=obj_file_id,
        owner_id=current_user.id,
        filename=file_doc["filename"],
        file_size=file_doc["file_size"],
        mime_type=file_doc.get("mime_type", "application/octet-stream"),
        expires_at=expires_at,
        password_hash=get_password_hash(request.password) if request.password else None,
        max_downloads=request.max_downloads
    )
    
    await public_shares.insert_one(share_doc.model_dump(by_alias=True))
    
    return PublicShareResponse(
        token=share_doc.token,
        url_base=f"/share/{share_doc.token}",  # Frontend will append #key=xxx
        expires_at=share_doc.expires_at,
        password_protected=bool(request.password),
        max_downloads=request.max_downloads
    )

@router.get("/public-links", response_model=List[PublicShareListItem])
async def get_my_public_links(
    current_user: User = Depends(get_current_user),
    public_shares: AsyncIOMotorCollection = Depends(get_public_shares_collection)
):
    """
    Gets all public links created by the current user.
    """
    shares = await public_shares.find({
        "owner_id": current_user.id
    }).sort("created_at", -1).to_list(length=100)
    
    now = datetime.utcnow()
    
    return [
        PublicShareListItem(
            id=str(share["_id"]),
            token=share["token"],
            file_id=str(share["file_id"]),
            filename=share["filename"],
            file_size=share["file_size"],
            created_at=share["created_at"],
            expires_at=share["expires_at"],
            download_count=share.get("download_count", 0),
            max_downloads=share.get("max_downloads"),
            password_protected=bool(share.get("password_hash")),
            is_active=share.get("is_active", True),
            is_expired=now > share["expires_at"]
        )
        for share in shares
    ]

@router.delete("/public-links/{token}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_public_link(
    token: str,
    current_user: User = Depends(get_current_user),
    public_shares: AsyncIOMotorCollection = Depends(get_public_shares_collection)
):
    """
    Revokes a public link (manual deletion before expiry).
    """
    share = await public_shares.find_one({"token": token})
    
    if not share:
        raise HTTPException(status_code=404, detail="Link not found")
    
    # Security check: only owner can revoke
    if share["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await public_shares.delete_one({"_id": share["_id"]})
    return

# ============================================================================
# PUBLIC ENDPOINTS (no authentication required)
# ============================================================================

@router.get("/share/{token}", response_model=PublicShareMetadata)
async def get_public_link_metadata(
    token: str,
    public_shares: AsyncIOMotorCollection = Depends(get_public_shares_collection)
):
    """
    Gets metadata about a public link (before download).
    No authentication required.
    """
    share = await public_shares.find_one({"token": token})
    
    if not share:
        raise HTTPException(status_code=404, detail="Link not found")
    
    now = datetime.utcnow()
    is_expired = now > share["expires_at"]
    
    # Check if expired
    if is_expired:
        # Clean up expired link
        await public_shares.delete_one({"_id": share["_id"]})
        raise HTTPException(status_code=410, detail="Link has expired")
    
    # Check if inactive
    if not share.get("is_active", True):
        raise HTTPException(status_code=410, detail="Link has been revoked")
    
    return PublicShareMetadata(
        filename=share["filename"],
        file_size=share["file_size"],
        mime_type=share["mime_type"],
        created_at=share["created_at"],
        expires_at=share["expires_at"],
        download_count=share.get("download_count", 0),
        max_downloads=share.get("max_downloads"),
        password_required=bool(share.get("password_hash")),
        is_expired=False
    )

@router.post("/share/{token}/download")
async def download_public_file(
    token: str,
    request: DownloadPublicFileRequest,
    public_shares: AsyncIOMotorCollection = Depends(get_public_shares_collection),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Downloads a public file (returns S3 presigned URL).
    No authentication required, but may need password.
    
    PRIVACY: Returns encrypted file blob. Client must decrypt using key from URL fragment.
    """
    share = await public_shares.find_one({"token": token})
    
    if not share:
        raise HTTPException(status_code=404, detail="Link not found")
    
    now = datetime.utcnow()
    
    # Check expiry
    if now > share["expires_at"]:
        await public_shares.delete_one({"_id": share["_id"]})
        raise HTTPException(status_code=410, detail="Link has expired")
    
    # Check if active
    if not share.get("is_active", True):
        raise HTTPException(status_code=410, detail="Link has been revoked")
    
    # Check password if required
    if share.get("password_hash"):
        if not request.password:
            raise HTTPException(status_code=401, detail="Password required")
        if not verify_password(request.password, share["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid password")
    
    # Check download limit
    if share.get("max_downloads") is not None:
        if share.get("download_count", 0) >= share["max_downloads"]:
            raise HTTPException(status_code=403, detail="Download limit reached")
    
    # Get file from database
    file_doc = await files.find_one({"_id": share["file_id"]})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get S3 key from file document
    s3_key = file_doc.get("file_path")
    if not s3_key:
        raise HTTPException(status_code=404, detail="File not found in storage")
    
    # Generate S3 presigned URL (5 minutes to download)
    try:
        download_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.s3_bucket_name,
                'Key': s3_key,
                'ResponseContentDisposition': f'attachment; filename="{share["filename"]}"'
            },
            ExpiresIn=300  # 5 minutes
        )
    except Exception as e:
        print(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail="Could not generate download URL")
    
    # Increment download counter
    await public_shares.update_one(
        {"_id": share["_id"]},
        {"$inc": {"download_count": 1}}
    )
    
    return {
        "download_url": download_url,
        "filename": share["filename"],
        "file_size": share["file_size"],
        "mime_type": share["mime_type"]
    }
