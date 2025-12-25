import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..models.user_model import User
from ..models.file_model import FileMetadata, FileMetadataResponse
from ..utils.auth import get_current_user
from ..db import get_file_collection,get_shared_files_collection, get_user_collection
from ..config import settings
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from ..utils.file_utils import s3_client, recursive_delete

# --- NEW Pydantic Models for our new routes ---
class UploadRequest(BaseModel):
    filename: str
    content_type: str
    file_size: int  # File size in bytes for quota check

class UploadResponse(BaseModel):
    upload_url: str
    s3_key: str  # We'll call the file path in S3 the 's3_key'

class FinalizeRequest(BaseModel):
    filename: str
    s3_key: str
    file_size: int
    parentId: Optional[str] = None
    encryptedFileKey: str  # The file's encryption key, encrypted with the user's master key

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

class MoveRequest(BaseModel):
    new_parent_id: Optional[str] = None  # None means move to root

class UpdateQuotaRequest(BaseModel):
    new_quota_bytes: int  # New quota in bytes (e.g., 10737418240 for 10GB)

class PaginatedFileResponse(BaseModel):
    items: List[FileMetadataResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


router = APIRouter()

# --- HELPER FUNCTIONS FOR FOLDER STATISTICS ---
async def calculate_folder_size(folder_id: ObjectId, files: AsyncIOMotorCollection) -> int:
    """
    Recursively calculate total size of all files in a folder
    """
    total_size = 0
    
    # Find all direct children
    children = await files.find({"parentId": folder_id}).to_list(None)
    
    for child in children:
        if child.get("isFolder"):
            # Recursively calculate subfolder size
            total_size += await calculate_folder_size(child["_id"], files)
        else:
            # Add file size
            total_size += child.get("file_size", 0)
    
    return total_size

async def count_folder_items(folder_id: ObjectId, files: AsyncIOMotorCollection) -> int:
    """
    Count direct children in folder (files + subfolders)
    """
    count = await files.count_documents({"parentId": folder_id})
    return count

async def get_all_descendant_ids(folder_id: ObjectId, files: AsyncIOMotorCollection) -> List[ObjectId]:
    """
    Recursively get all descendant folder IDs (children, grandchildren, etc.)
    """
    descendant_ids = [folder_id]
    
    # Find direct children folders
    children = await files.find({"parentId": folder_id, "isFolder": True}).to_list(None)
    
    for child in children:
        # Recursively get descendants of this child
        child_descendants = await get_all_descendant_ids(child["_id"], files)
        descendant_ids.extend(child_descendants)
    
    return descendant_ids

# --- NEW: REQUEST UPLOAD URL ---
@router.post("/request-upload-url", response_model=UploadResponse)
async def request_upload_url(
    request: UploadRequest,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    First step of upload. Client asks for a URL to upload to.
    Checks storage quota before generating the presigned URL.
    """
    # Get user's quota from their profile (supports future premium plans)
    USER_QUOTA_BYTES = current_user.quota  # Default is 5GB, but can be increased via payment
    
    # Calculate current storage usage
    pipeline = [
        {"$match": {"owner_id": current_user.id}},
        {"$group": {"_id": None, "total_usage": {"$sum": "$file_size"}}}
    ]
    
    result = await files.aggregate(pipeline).to_list(length=1)
    current_usage = 0
    if result:
        current_usage = result[0].get("total_usage", 0)
    
    # Check if adding this file would exceed the quota
    if current_usage + request.file_size > USER_QUOTA_BYTES:
        used_gb = current_usage / (1024 * 1024 * 1024)
        quota_gb = USER_QUOTA_BYTES / (1024 * 1024 * 1024)
        file_mb = request.file_size / (1024 * 1024)
        raise HTTPException(
            status_code=413,  # 413 Payload Too Large
            detail=f"Your storage quota has been exceeded."
        )
    
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
        "parentId": parent_obj_id,
        "encryptedFileKey": None # Folders don't have a file key
    }
    
    new_folder = await files.insert_one(folder_metadata)
    created_folder = await files.find_one({"_id": new_folder.inserted_id})
    
    # Calculate folder statistics
    calculated_size = await calculate_folder_size(created_folder["_id"], files)
    item_count = await count_folder_items(created_folder["_id"], files)
    
    return FileMetadataResponse(
        id=str(created_folder["_id"]),
        filename=created_folder["filename"],
        owner_id=str(created_folder["owner_id"]),
        upload_time=created_folder["upload_time"].isoformat() + "Z",  # Add Z to mark as UTC
        file_size=created_folder["file_size"],
        isFolder=created_folder["isFolder"],
        parentId=str(created_folder["parentId"]) if created_folder["parentId"] else None,
        calculatedSize=calculated_size,
        itemCount=item_count
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
        "parentId": parent_obj_id , # Set the parent folder 
        "encryptedFileKey": request.encryptedFileKey
    }
    
    new_file = await files.insert_one(file_metadata)
    created_file = await files.find_one({"_id": new_file.inserted_id})
    
    # ... (return FileMetadataResponse with new fields)
    return FileMetadataResponse(
        id=str(created_file["_id"]),
        filename=created_file["filename"],
        owner_id=str(created_file["owner_id"]),
        upload_time=created_file["upload_time"].isoformat() + "Z",  # Add Z to mark as UTC
        file_size=created_file["file_size"],
        isFolder=created_file["isFolder"],
        parentId=str(created_file["parentId"]) if created_file["parentId"] else None,
        encryptedFileKey=created_file.get("encryptedFileKey")
    )

# --- UNCHANGED: LIST FILES ---
# This endpoint works perfectly as-is! It just reads from Mongo.
@router.get("/", response_model=PaginatedFileResponse)
async def list_items(
    parentId: Optional[str] = None, # 5. Add parentId query parameter
    page: int = 1,
    page_size: int = 50,
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

    # Get total count
    total_count = await files.count_documents(query)
    
    # Calculate pagination
    skip = (page - 1) * page_size
    total_pages = (total_count + page_size - 1) // page_size  # Ceiling division
    
    # Fetch paginated results
    user_files = await files.find(query).skip(skip).limit(page_size).to_list(length=page_size)
    
    response_list = []
    for f in user_files:
        # Calculate folder statistics if it's a folder
        calculated_size = None
        item_count = None
        
        if f.get("isFolder"):
            calculated_size = await calculate_folder_size(f["_id"], files)
            item_count = await count_folder_items(f["_id"], files)
        
        response_list.append(
            FileMetadataResponse(
                id=str(f["_id"]),
                filename=f["filename"],
                owner_id=str(f["owner_id"]),
                upload_time=f["upload_time"].isoformat() + "Z",  # Add Z to mark as UTC
                file_size=f.get("file_size", 0),
                isFolder=f.get("isFolder", False),
                parentId=str(f["parentId"]) if f.get("parentId") else None,
                encryptedFileKey=f.get("encryptedFileKey"),
                calculatedSize=calculated_size,
                itemCount=item_count
            )
        )
    
    return PaginatedFileResponse(
        items=response_list,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

# --- NEW: SEARCH FILES AND FOLDERS ---
@router.get("/search", response_model=PaginatedFileResponse)
async def search_items(
    query: str,
    parentId: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Search for files and folders recursively under a specific folder (or root).
    Returns all matching items from the current level and all subdirectories.
    """
    if not query or len(query.strip()) == 0:
        return PaginatedFileResponse(
            items=[],
            total=0,
            page=page,
            page_size=page_size,
            total_pages=0
        )
    
    search_query = {"owner_id": current_user.id}
    
    # Determine which folders to search in
    if parentId:
        try:
            parent_obj_id = ObjectId(parentId)
            # Get all descendant folder IDs (current folder + all subfolders)
            folder_ids = await get_all_descendant_ids(parent_obj_id, files)
            # Search in current folder and all descendants
            search_query["$or"] = [
                {"parentId": {"$in": folder_ids}},
                {"_id": parent_obj_id}  # Include the parent folder itself if it matches
            ]
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid parentId format")
    else:
        # Search from root: get all files owned by user
        # We don't need to filter by parentId, just search all user's files
        pass
    
    # Add filename search (case-insensitive)
    search_query["filename"] = {"$regex": query, "$options": "i"}
    
    # Get total count of matching items
    total_count = await files.count_documents(search_query)
    
    # Calculate pagination
    skip = (page - 1) * page_size
    total_pages = (total_count + page_size - 1) // page_size
    
    # Fetch paginated results
    matching_files = await files.find(search_query).skip(skip).limit(page_size).to_list(length=page_size)
    
    response_list = []
    for f in matching_files:
        # Calculate folder statistics if it's a folder
        calculated_size = None
        item_count = None
        
        if f.get("isFolder"):
            calculated_size = await calculate_folder_size(f["_id"], files)
            item_count = await count_folder_items(f["_id"], files)
        
        response_list.append(
            FileMetadataResponse(
                id=str(f["_id"]),
                filename=f["filename"],
                owner_id=str(f["owner_id"]),
                upload_time=f["upload_time"].isoformat() + "Z",
                file_size=f.get("file_size", 0),
                isFolder=f.get("isFolder", False),
                parentId=str(f["parentId"]) if f.get("parentId") else None,
                encryptedFileKey=f.get("encryptedFileKey"),
                calculatedSize=calculated_size,
                itemCount=item_count
            )
        )
    
    return PaginatedFileResponse(
        items=response_list,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{file_id}", response_model=FileMetadataResponse)
async def get_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Get a single file's metadata by ID.
    """
    try:
        obj_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID format")
    
    file_doc = await files.find_one({"_id": obj_id})
    
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Security check: only owner can access
    if file_doc["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Calculate folder statistics if it's a folder
    calculated_size = None
    item_count = None
    
    if file_doc.get("isFolder"):
        calculated_size = await calculate_folder_size(file_doc["_id"], files)
        item_count = await count_folder_items(file_doc["_id"], files)
    
    return FileMetadataResponse(
        id=str(file_doc["_id"]),
        filename=file_doc["filename"],
        owner_id=str(file_doc["owner_id"]),
        upload_time=file_doc["upload_time"].isoformat() + "Z",
        file_size=file_doc.get("file_size", 0),
        isFolder=file_doc.get("isFolder", False),
        parentId=str(file_doc["parentId"]) if file_doc.get("parentId") else None,
        encryptedFileKey=file_doc.get("encryptedFileKey"),
        calculatedSize=calculated_size,
        itemCount=item_count
    )

@router.get("/download-url/{file_id}", response_model=DownloadResponse)
async def get_download_url(
    file_id: str,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection),
    # 2. ADD THE SHARED_FILES COLLECTION
    shared_files: AsyncIOMotorCollection = Depends(get_shared_files_collection) 
):
    """
    Client asks for a URL to download a file from.
    This now checks if the user is the owner OR if the file
    has been shared with them.
    """
    try:
        obj_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID format")

    file_metadata = await files.find_one({"_id": obj_id})

    if not file_metadata:
        raise HTTPException(status_code=404, detail="File not found")

    # --- 3. THE NEW PERMISSION LOGIC ---
    is_owner = file_metadata["owner_id"] == current_user.id
    is_recipient = False
    
    if not is_owner:
        # If not the owner, check if a share record exists
        share_record = await shared_files.find_one({
            "file_id": obj_id,
            "recipient_id": current_user.id
        })
        if share_record:
            is_recipient = True

    # If the user is NOT the owner AND NOT a recipient, deny access
    if not is_owner and not is_recipient:
        raise HTTPException(status_code=403, detail="Access denied")
    # ------------------------------------

    # If we get here, the user has permission.
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
    Returns the user's quota (can be upgraded via payment gateway in the future).
    """
    # Get user's quota from their profile (supports future premium plans)
    USER_QUOTA_BYTES = current_user.quota  # Default is 5GB, can be increased

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
        parentId=str(updated_file["parentId"]) if updated_file.get("parentId") else None,
        encryptedFileKey=updated_file.get("encryptedFileKey")
    )


@router.put("/{file_id}/move", response_model=FileMetadataResponse)
async def move_item(
    file_id: str,
    request: MoveRequest,
    current_user: User = Depends(get_current_user),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Moves a file or folder to a new parent folder (or root if new_parent_id is None).
    Prevents circular references when moving folders.
    """
    try:
        obj_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID format")

    # Find the item to move
    item = await files.find_one({"_id": obj_id})

    # Security Check - verify ownership
    if not item or item["owner_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    # Validate new parent ID format if provided
    new_parent_oid = None
    if request.new_parent_id:
        try:
            new_parent_oid = ObjectId(request.new_parent_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid parent ID format")

        # Verify destination folder exists and is owned by user
        dest_folder = await files.find_one({"_id": new_parent_oid})
        if not dest_folder or dest_folder["owner_id"] != current_user.id:
            raise HTTPException(status_code=404, detail="Destination folder not found or access denied")

        # Verify destination is actually a folder
        if not dest_folder.get("isFolder", False):
            raise HTTPException(status_code=400, detail="Destination must be a folder")

        # Prevent circular references: cannot move a folder into itself or its descendants
        if item.get("isFolder", False):
            # Get all descendant folder IDs
            descendant_ids = await get_all_descendant_ids(file_id, files)
            
            # Check if destination is the item itself or one of its descendants
            if str(new_parent_oid) == file_id or str(new_parent_oid) in descendant_ids:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot move a folder into itself or its descendants"
                )

    # Perform the move
    await files.update_one(
        {"_id": obj_id},
        {"$set": {"parentId": new_parent_oid}}
    )

    # Get the updated document
    updated_item = await files.find_one({"_id": obj_id})

    # Return the updated item
    return FileMetadataResponse(
        id=str(updated_item["_id"]),
        filename=updated_item["filename"],
        owner_id=str(updated_item["owner_id"]),
        upload_time=updated_item["upload_time"].isoformat(),
        file_size=updated_item.get("file_size", 0),
        isFolder=updated_item.get("isFolder", False),
        parentId=str(updated_item["parentId"]) if updated_item.get("parentId") else None,
        encryptedFileKey=updated_item.get("encryptedFileKey")
    )