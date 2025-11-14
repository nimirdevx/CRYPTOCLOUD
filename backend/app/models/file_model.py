from pydantic import BaseModel, Field
from bson import ObjectId
from datetime import datetime

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

class FileMetadata(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    filename: str
    owner_id: PyObjectId
    upload_time: datetime = Field(default_factory=datetime.utcnow)
    file_path: str
    file_size: int

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {ObjectId: str, datetime: lambda dt: dt.isoformat()}

class FileMetadataResponse(BaseModel):
    id: str
    filename: str
    owner_id: str
    upload_time: str
    file_size: int
