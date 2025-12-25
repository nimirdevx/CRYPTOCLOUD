from pydantic import BaseModel, Field
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional
from .user_model import PyObjectId
import secrets

class PublicShare(BaseModel):
    """
    Public share link model - for sharing files with anyone via a link.
    Self-destructs after 24 hours.
    
    PRIVACY NOTE: Decryption keys are NEVER stored in the database.
    Keys are embedded in URL fragments (client-side only).
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    token: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    
    file_id: PyObjectId
    owner_id: PyObjectId
    
    # File metadata (safe to store in plaintext)
    filename: str
    file_size: int
    mime_type: str
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime  # Must be set: created_at + 24 hours
    
    # Optional security features
    password_hash: Optional[str] = None  # Bcrypt hash if password-protected
    max_downloads: Optional[int] = None   # Limit number of downloads
    download_count: int = 0               # Track usage
    
    # Control
    is_active: bool = True  # Allow manual revocation before expiry
    
    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {ObjectId: str}

class CreatePublicShareRequest(BaseModel):
    """Request to create a public share link"""
    password: Optional[str] = None  # Optional password protection
    max_downloads: Optional[int] = None  # Optional download limit
    expires_in_hours: int = Field(default=24, ge=1, le=168)  # 1 hour to 7 days

class PublicShareResponse(BaseModel):
    """Response when creating a public link"""
    token: str
    url_base: str  # Frontend will append #key=xxx
    expires_at: datetime
    password_protected: bool
    max_downloads: Optional[int]
    
class PublicShareMetadata(BaseModel):
    """Public metadata returned before download (no auth required)"""
    filename: str
    file_size: int
    mime_type: str
    created_at: datetime
    expires_at: datetime
    download_count: int
    max_downloads: Optional[int]
    password_required: bool
    is_expired: bool

class PublicShareListItem(BaseModel):
    """Item in user's public links list"""
    id: str
    token: str
    file_id: str
    filename: str
    file_size: int
    created_at: datetime
    expires_at: datetime
    download_count: int
    max_downloads: Optional[int]
    password_protected: bool
    is_active: bool
    is_expired: bool

class DownloadPublicFileRequest(BaseModel):
    """Request to download a public file (if password-protected)"""
    password: Optional[str] = None
