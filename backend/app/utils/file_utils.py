import boto3
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from ..config import settings

# Create the S3 client here, so both files can use it
s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.s3_region
)

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