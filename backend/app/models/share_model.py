from pydantic import BaseModel, Field
from bson import ObjectId
from datetime import datetime
from typing import Optional,List
from .user_model import PyObjectId # Re-use PyObjectId

class SharedFile(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    owner_id: PyObjectId
    recipient_id: PyObjectId
    file_id: PyObjectId
    
    # This is the file's AES key, encrypted with the RECIPIENT'S public key
    encryptedFileKey: str 
    
    shared_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {ObjectId: str}

class UserSearchResponse(BaseModel):
    id: str
    username: str
    publicKey: str # We send the public key so the client can encrypt

class ShareRequest(BaseModel):
    recipientUsername: str
    encryptedFileKey: str # The key, already encrypted by the 
    
class SharedFileResponse(BaseModel):
    id: str # This is the ID of the *share record*
    file_id: str # This is the ID of the *file*
    filename: str
    file_size: int
    owner_username: str
    shared_at: datetime
    encryptedFileKey: str # The key for the recipient to decrypt

class ShareRecipient(BaseModel):
    share_id: str # The ID of the share record (for deletion)
    recipient_id: str
    recipient_username: str

# This is the rich object for the "Shared By Me" page.
# It groups all recipients under a single file.
class MyShareResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int
    shares: List[ShareRecipient] # A list of all people this file is shared with