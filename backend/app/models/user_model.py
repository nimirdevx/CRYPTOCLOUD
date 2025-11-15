from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, field):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class UserCreate(BaseModel):
    username: str
    password: str
    publicKey: str  # The user's public key (base64 string)
    encryptedPrivateKey: str # The user's private key (encrypted with their password)
    
class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    username: str
    hashed_password: str
    
    is_2fa_enabled: bool = Field(default=False)
    totp_secret: Optional[str] = None
    
    publicKey: Optional[str] = None
    encryptedPrivateKey: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {ObjectId: str}

class UserResponse(BaseModel):
    id: str
    username: str
    is_2fa_enabled: bool
