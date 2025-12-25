import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorCollection

from ..models.user_model import User, UserResponse
from ..utils.auth import get_current_user
from ..db import get_user_collection
from ..config import settings
from ..utils.file_utils import s3_client
from bson import ObjectId

router = APIRouter()

# --- Helper Function ---
def generate_profile_picture_presigned_url(s3_key: Optional[str]) -> Optional[str]:
    """
    Helper function to generate a presigned URL for viewing a profile picture.
    Returns None if s3_key is None or empty.
    """
    if not s3_key:
        return None
    
    try:
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.s3_bucket_name,
                'Key': s3_key,
            },
            ExpiresIn=3600  # URL is valid for 1 hour
        )
        return presigned_url
    except Exception as e:
        print(f"Error generating presigned URL: {e}")
        return None

# --- Pydantic Models ---
class ProfilePictureUploadRequest(BaseModel):
    content_type: str  # e.g., "image/jpeg", "image/png"

class ProfilePictureUploadResponse(BaseModel):
    upload_url: str
    s3_key: str

class ProfilePictureFinalizeRequest(BaseModel):
    s3_key: str

class ProfilePictureResponse(BaseModel):
    profile_picture_url: Optional[str]  # This will be a presigned URL for viewing
    s3_key: Optional[str]  # The actual S3 key stored in DB


# --- REQUEST PROFILE PICTURE UPLOAD URL ---
@router.post("/request-upload-url", response_model=ProfilePictureUploadResponse)
async def request_profile_picture_upload_url(
    request: ProfilePictureUploadRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate a presigned URL for uploading a profile picture to S3.
    Only accepts image content types.
    """
    # Validate content type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if request.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid content type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Generate a unique key for the profile picture in S3
    file_extension = request.content_type.split('/')[-1]
    if file_extension == "jpeg":
        file_extension = "jpg"
    s3_key = f"profiles/{current_user.id}/profile-{uuid.uuid4()}.{file_extension}"
    
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
        raise HTTPException(
            status_code=500, 
            detail=f"Could not generate upload URL: {e}"
        )
    
    return ProfilePictureUploadResponse(upload_url=upload_url, s3_key=s3_key)


# --- FINALIZE PROFILE PICTURE UPLOAD ---
@router.post("/finalize-upload", response_model=UserResponse)
async def finalize_profile_picture_upload(
    request: ProfilePictureFinalizeRequest,
    current_user: User = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    """
    After the client uploads the profile picture to S3, this endpoint
    saves the S3 key in the database (not a URL, since S3 objects are private).
    """
    # Delete old profile picture from S3 if it exists
    if current_user.profile_picture_url:
        try:
            # The profile_picture_url field now stores the S3 key
            old_key = current_user.profile_picture_url
            s3_client.delete_object(
                Bucket=settings.s3_bucket_name,
                Key=old_key
            )
        except Exception as e:
            # Log but don't fail if old image deletion fails
            print(f"Warning: Could not delete old profile picture: {e}")
    
    # Store the S3 key (not a URL) in the database
    result = await users.update_one(
        {"_id": current_user.id},
        {"$set": {"profile_picture_url": request.s3_key}}  # Store S3 key
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=500,
            detail="Failed to update profile picture"
        )
    
    # Fetch the updated user
    updated_user = await users.find_one({"_id": current_user.id})
    
    # Generate presigned URL for the response
    profile_pic_url = generate_profile_picture_presigned_url(
        updated_user.get("profile_picture_url")
    )
    
    return UserResponse(
        id=str(updated_user["_id"]),
        username=updated_user["username"],
        email=updated_user["email"],
        is_2fa_enabled=updated_user.get("is_2fa_enabled", False),
        profile_picture_url=profile_pic_url
    )


# --- GET PROFILE PICTURE ---
@router.get("/picture", response_model=ProfilePictureResponse)
async def get_profile_picture(
    current_user: User = Depends(get_current_user)
):
    """
    Get the current user's profile picture as a presigned URL for viewing.
    Returns the S3 key and a presigned URL valid for 1 hour.
    """
    if not current_user.profile_picture_url:
        return ProfilePictureResponse(profile_picture_url=None, s3_key=None)
    
    try:
        # Generate presigned URL for GET (viewing)
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.s3_bucket_name,
                'Key': current_user.profile_picture_url,  # This is the S3 key
            },
            ExpiresIn=3600  # URL is valid for 1 hour
        )
        return ProfilePictureResponse(
            profile_picture_url=presigned_url,
            s3_key=current_user.profile_picture_url
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate view URL: {e}"
        )


# --- DELETE PROFILE PICTURE ---
@router.delete("/picture", response_model=UserResponse)
async def delete_profile_picture(
    current_user: User = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    """
    Delete the user's profile picture from S3 and remove the URL from the database.
    """
    if not current_user.profile_picture_url:
        raise HTTPException(
            status_code=404,
            detail="No profile picture to delete"
        )
    
    try:
        # The profile_picture_url field stores the S3 key directly
        s3_key = current_user.profile_picture_url
        
        # Delete from S3
        s3_client.delete_object(
            Bucket=settings.s3_bucket_name,
            Key=s3_key
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete profile picture from storage: {e}"
        )
    
    # Remove the URL from the database
    result = await users.update_one(
        {"_id": current_user.id},
        {"$set": {"profile_picture_url": None}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=500,
            detail="Failed to update database"
        )
    
    # Fetch the updated user
    updated_user = await users.find_one({"_id": current_user.id})
    
    # Generate presigned URL for the response (will be None since we just deleted it)
    profile_pic_url = generate_profile_picture_presigned_url(
        updated_user.get("profile_picture_url")
    )
    
    return UserResponse(
        id=str(updated_user["_id"]),
        username=updated_user["username"],
        email=updated_user["email"],
        is_2fa_enabled=updated_user.get("is_2fa_enabled", False),
        profile_picture_url=profile_pic_url
    )


# --- GET PROFILE PICTURE BY USER ID ---
@router.get("/picture/{user_id}", response_model=ProfilePictureResponse)
async def get_user_profile_picture(
    user_id: str,
    current_user: User = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    """
    Get a specific user's profile picture as a presigned URL.
    This allows viewing other users' profile pictures (e.g., in shares lists).
    """
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = await users.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile_picture_s3_key = user.get("profile_picture_url")
    if not profile_picture_s3_key:
        return ProfilePictureResponse(profile_picture_url=None, s3_key=None)
    
    try:
        # Generate presigned URL for GET (viewing)
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.s3_bucket_name,
                'Key': profile_picture_s3_key,
            },
            ExpiresIn=3600  # URL is valid for 1 hour
        )
        return ProfilePictureResponse(
            profile_picture_url=presigned_url,
            s3_key=profile_picture_s3_key
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate view URL: {e}"
        )
