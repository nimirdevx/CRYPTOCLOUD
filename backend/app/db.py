from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client = AsyncIOMotorClient(settings.mongo_uri)
db = client.get_database("cryptocloud")

def get_user_collection():
    return db.get_collection("users")

def get_file_collection():
    return db.get_collection("files")
