from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId

from ..models.user_model import User
from ..models.share_model import SharedFile, UserSearchResponse, ShareRequest, SharedFileResponse,MyShareResponse, ShareRecipient
from ..utils.auth import get_current_user
from ..db import get_user_collection, get_file_collection, get_shared_files_collection
from motor.motor_asyncio import AsyncIOMotorCollection

# Pagination response models
class PaginatedSharedFilesResponse(BaseModel):
    items: List[SharedFileResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class PaginatedMySharesResponse(BaseModel):
    items: List[MyShareResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

router = APIRouter()

@router.get("/users/search", response_model=List[UserSearchResponse])
async def search_users(
    username: str,
    current_user: User = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    """
    Finds users by username for sharing.
    Returns a list of users matching the search.
    """
    if not username:
        return []
    
    # Find users whose username starts with the query, case-insensitive
    # Limit to 5 results for performance
    # Exclude the current user from the search
    user_docs = await users.find({
        "username": {"$regex": f"^{username}", "$options": "i"},
        "_id": {"$ne": current_user.id} 
    }).limit(5).to_list(length=5)
    
    return [
        UserSearchResponse(
            id=str(user["_id"]),
            username=user["username"],
            publicKey=user.get("publicKey")
        ) for user in user_docs if user.get("publicKey") # Only return users who have a public key
    ]

@router.post("/files/{file_id}/share", status_code=status.HTTP_201_CREATED)
async def share_file(
    file_id: str,
    request: ShareRequest,
    current_user: User = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_user_collection),
    files: AsyncIOMotorCollection = Depends(get_file_collection),
    shared_files: AsyncIOMotorCollection = Depends(get_shared_files_collection)
):
    """
    Shares a file with another user.
    """
    # 1. Find the recipient
    recipient = await users.find_one({"username": request.recipientUsername})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user not found")
    recipient_id = recipient["_id"]

    # 2. Find the file
    try:
        obj_file_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID")
        
    file_doc = await files.find_one({"_id": obj_file_id})
    if not file_doc or file_doc["owner_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    # 3. Check if already shared
    existing_share = await shared_files.find_one({
        "file_id": obj_file_id,
        "recipient_id": recipient_id
    })
    if existing_share:
        raise HTTPException(status_code=400, detail="File already shared with this user")

    # 4. Create the new share document
    share_doc = SharedFile(
        owner_id=current_user.id,
        recipient_id=recipient_id,
        file_id=obj_file_id,
        encryptedFileKey=request.encryptedFileKey
    )
    
    await shared_files.insert_one(share_doc.model_dump(by_alias=True))
    
    return {"message": "File shared successfully"}


@router.get("/shared-with-me", response_model=PaginatedSharedFilesResponse)
async def get_shared_with_me(
    page: int = 1,
    page_size: int = 50,
    current_user: User = Depends(get_current_user),
    shared_files: AsyncIOMotorCollection = Depends(get_shared_files_collection)
):
    """
    Gets all files that have been shared with the current user.
    This uses an aggregation pipeline to join data from 3 collections.
    """
    
    # First, count total documents
    total_count = await shared_files.count_documents({"recipient_id": current_user.id})
    
    # Calculate pagination
    skip = (page - 1) * page_size
    total_pages = (total_count + page_size - 1) // page_size
    
    pipeline = [
        {
            # 1. Find all share records for the current user
            "$match": { "recipient_id": current_user.id }
        },
        { "$skip": skip },
        { "$limit": page_size },
        {
            # 2. Join with the 'files' collection to get file details
            "$lookup": {
                "from": "files",
                "localField": "file_id",
                "foreignField": "_id",
                "as": "fileDetails"
            }
        },
        { "$unwind": "$fileDetails" }, # Deconstruct the fileDetails array
        {
            # 3. Join with the 'users' collection to get the owner's username
            "$lookup": {
                "from": "users",
                "localField": "owner_id",
                "foreignField": "_id",
                "as": "ownerDetails"
            }
        },
        { "$unwind": "$ownerDetails" }, # Deconstruct the ownerDetails array
        {
            # 4. Project the final shape we want
            "$project": {
                "_id": 0,
                "id": { "$toString": "$_id" }, # Share ID
                "file_id": { "$toString": "$file_id" },
                "filename": "$fileDetails.filename",
                "file_size": "$fileDetails.file_size",
                "owner_username": "$ownerDetails.username",
                "shared_at": "$shared_at",
                "encryptedFileKey": "$encryptedFileKey"
            }
        }
    ]
    
    try:
        results = await shared_files.aggregate(pipeline).to_list(length=page_size)
        return PaginatedSharedFilesResponse(
            items=results,
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    except Exception as e:
        print(f"Error in aggregation: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve shared files")

# --- 2. ADD NEW ENDPOINT: GET /shared-by-me ---    
@router.get("/shared-by-me", response_model=PaginatedMySharesResponse)
async def get_shared_by_me(
    page: int = 1,
    page_size: int = 50,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection),
    shared_files: AsyncIOMotorCollection = Depends(get_shared_files_collection)
):
    """
    Gets all files owned by the current user that have been shared.
    This groups shares by file.
    """
    
    # First count: We need to count how many files have shares
    count_pipeline = [
        {"$match": { "owner_id": current_user.id }},
        {
            "$lookup": {
                "from": "shared_files",
                "localField": "_id",
                "foreignField": "file_id",
                "as": "shares"
            }
        },
        {"$match": { "shares": { "$ne": [] } }},
        {"$count": "total"}
    ]
    
    count_result = await files.aggregate(count_pipeline).to_list(length=1)
    total_count = count_result[0]["total"] if count_result else 0
    
    # Calculate pagination
    skip = (page - 1) * page_size
    total_pages = (total_count + page_size - 1) // page_size
    
    pipeline = [
        {
            # 1. Find all files owned by the current user
            "$match": { "owner_id": current_user.id }
        },
        {
            # 2. Join with 'shared_files' to find all shares for each file
            "$lookup": {
                "from": "shared_files",
                "localField": "_id",
                "foreignField": "file_id",
                "as": "shares"
            }
        },
        {
            # 3. Filter out files that have no shares
            "$match": { "shares": { "$ne": [] } }
        },
        { "$skip": skip },
        { "$limit": page_size },
        {
            # 4. Join with 'users' to get recipient details
            "$lookup": {
                "from": "users",
                "localField": "shares.recipient_id",
                "foreignField": "_id",
                "as": "recipientDetails"
            }
        },
        {
            # 5. Project the final shape
            "$project": {
                "_id": 0,
                "file_id": { "$toString": "$_id" },
                "filename": "$filename",
                "file_size": "$file_size",
                "shares": {
                    # Map shares to include recipient usernames
                    "$map": {
                        "input": "$shares",
                        "as": "share",
                        "in": {
                            "share_id": { "$toString": "$$share._id" },
                            "recipient_id": { "$toString": "$$share.recipient_id" },
                            "recipient_username": {
                                "$arrayElemAt": [
                                    "$recipientDetails.username",
                                    { "$indexOfArray": [ "$recipientDetails._id", "$$share.recipient_id" ] }
                                ]
                            }
                        }
                    }
                }
            }
        }
    ]
    
    try:
        results = await files.aggregate(pipeline).to_list(length=page_size)
        return PaginatedMySharesResponse(
            items=results,
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    except Exception as e:
        print(f"Error in aggregation: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve shared files")

# --- 3. ADD NEW ENDPOINT: DELETE /share/{share_id} ---
@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unshare_file(
    share_id: str,
    current_user: User = Depends(get_current_user),
    shared_files: AsyncIOMotorCollection = Depends(get_shared_files_collection)
):
    """
    Revokes a share. This only deletes the share record, not the file.
    """
    try:
        obj_share_id = ObjectId(share_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid share ID")

    # Find the share record
    share_doc = await shared_files.find_one({"_id": obj_share_id})
    if not share_doc:
        raise HTTPException(status_code=404, detail="Share record not found")

    # Security Check: Only the *owner* of the file can delete the share
    if share_doc["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You are not the owner of this file")

    # Delete the share record
    await shared_files.delete_one({"_id": obj_share_id})
    
    return # Returns 204 No Content