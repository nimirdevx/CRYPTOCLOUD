import motor
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

# --- Create the MongoDB Client ---
try:
    client = motor.motor_asyncio.AsyncIOMotorClient(
        settings.mongo_uri
    )
    db = client.get_database("cryptocloud")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    client = None
    db = None

def get_db():
    """Dependency to get the database."""
    return db

def get_user_collection():
    """Dependency to get the users collection."""
    if db is not None:
        return db.get_collection("users")
    raise Exception("Database not initialized")

def get_file_collection():
    """Dependency to get the files collection."""
    if db is not None:
        return db.get_collection("files")
    raise Exception("Database not initialized")

# --- ADD THIS NEW FUNCTION ---
def get_shared_files_collection():
    """Dependency to get the shared_files collection."""
    if db is not None:
        return db.get_collection("shared_files")
    raise Exception("Database not initialized")

def get_public_shares_collection():
    """Dependency to get the public_shares collection."""
    if db is not None:
        return db.get_collection("public_shares")
    raise Exception("Database not initialized")