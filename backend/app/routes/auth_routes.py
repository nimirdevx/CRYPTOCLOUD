import pyotp
import qrcode
import io
import base64
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import boto3
from ..models.user_model import UserCreate, User, UserResponse
from ..utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from ..db import get_user_collection
from ..db import get_file_collection

from motor.motor_asyncio import AsyncIOMotorCollection
from ..config import settings

router = APIRouter()

# --- NEW Pydantic models for 2FA ---
class TwoFaCode(BaseModel):
    totp_code: str

class TwoFaLoginRequest(BaseModel):
    username: str
    password: str
    totp_code: str


# -------------------------------------
class DeleteAccountRequest(BaseModel):
    password: str
    
# --- S3 Client (for deleting files) ---
s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.s3_region
)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, users: AsyncIOMotorCollection = Depends(get_user_collection)):
    
    existing_user = await users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    hashed_password = get_password_hash(user.password)
    # Create the full user document with 2FA fields disabled
    new_user_data = {"username": user.username, "hashed_password": hashed_password, "is_2fa_enabled": False, "totp_secret": None}
    new_user = await users.insert_one(new_user_data)
    created_user = await users.find_one({"_id": new_user.inserted_id})
    
    # Return the full UserResponse
    return UserResponse(
        id=str(created_user["_id"]), 
        username=created_user["username"], 
        is_2fa_enabled=created_user["is_2fa_enabled"]
    )


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), users: AsyncIOMotorCollection = Depends(get_user_collection)):
    
    # --- THIS LOGIC WAS MISSING ---
    # Find the user in the database
    user_doc = await users.find_one({"username": form_data.username})

    # Verify their password
    if not user_doc or not verify_password(form_data.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # --- END OF FIX ---

    # --- 2FA CHECK ---
    # This line will now work correctly
    if user_doc.get("is_2fa_enabled", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="2FA_REQUIRED",
        )
    # ------------------

    # User does NOT have 2FA, log them in normally.
    access_token = create_access_token(data={"sub": str(user_doc["_id"])})

    # --- UPDATED RETURN STATEMENT ---
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "is_2fa_enabled": False  # Send 2FA status
    }

# --- NEW /2fa/login endpoint ---
@router.post("/2fa/login")
async def login_2fa(request: TwoFaLoginRequest, users: AsyncIOMotorCollection = Depends(get_user_collection)):
    """
    This is the new login route for users who have 2FA enabled.
    """
    user_doc = await users.find_one({"username": request.username})

    # 1. Verify password
    if not user_doc or not verify_password(request.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # 2. Verify 2FA code
    if not user_doc.get("is_2fa_enabled") or not user_doc.get("totp_secret"):
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled for this account",
        )
        
    totp = pyotp.TOTP(user_doc["totp_secret"])
    if not totp.verify(request.totp_code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA code",
        )

    # 3. Both are valid, issue token
    access_token = create_access_token(data={"sub": str(user_doc["_id"])})
    
    # --- UPDATED RETURN STATEMENT ---
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "is_2fa_enabled": True  # Send 2FA status
    }


# --- NEW /2fa/generate endpoint ---
@router.post("/2fa/generate", response_model=dict)
async def generate_2fa(
    current_user: User = Depends(get_current_user), 
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    """
    Generates a new TOTP secret and a QR code for the user to scan.
    """
    # Generate a new TOTP secret
    secret = pyotp.random_base32()
    
    # Create the provisioning URI (this is what the authenticator app reads)
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.username, 
        issuer_name="CryptoCloud"
    )
    
    # Save the secret to the user's document in the database
    await users.update_one(
        {"_id": current_user.id}, 
        {"$set": {"totp_secret": secret, "is_2fa_enabled": False}} # Disable 2FA until verified
    )
    
    # Generate the QR code as a base64-encoded image
    img = qrcode.make(totp_uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    
    return {"qr_code_data_url": f"data:image/png;base64,{qr_base64}", "secret": secret}

# --- NEW /2fa/verify endpoint ---
@router.post("/2fa/verify", response_model=dict)
async def verify_2fa(
    request: TwoFaCode,
    current_user: User = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    """
    Verifies the code from the authenticator app and enables 2FA.
    """
    user_doc = await users.find_one({"_id": current_user.id})
    secret = user_doc.get("totp_secret")
    
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No 2FA secret found. Please generate one first."
        )

    totp = pyotp.TOTP(secret)
    if not totp.verify(request.totp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA code."
        )
    
    # Code is valid, permanently enable 2FA
    await users.update_one(
        {"_id": current_user.id},
        {"$set": {"is_2fa_enabled": True}}
    )
    
    return {"message": "2FA enabled successfully!"}

# --- NEW /auth/me endpoint (DELETE) ---
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    request: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_user_collection),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    """
    Deletes a user's account and all associated data.
    Requires password re-authentication.
    """
    
    # 1. Verify password
    user_doc = await users.find_one({"_id": current_user.id})
    if not verify_password(request.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
        )

    # 2. Find all user's files in S3
    user_files = await files.find({"owner_id": current_user.id}).to_list(length=None)
    
    if user_files:
        # 3. Delete files from S3 bucket
        s3_keys_to_delete = [{"Key": f["file_path"]} for f in user_files]
        try:
            s3_client.delete_objects(
                Bucket=settings.s3_bucket_name,
                Delete={'Objects': s3_keys_to_delete}
            )
        except Exception as e:
            # Don't stop the deletion, but log the error
            print(f"Error deleting S3 objects for user {current_user.id}: {e}")

    # 4. Delete all file metadata from MongoDB
    await files.delete_many({"owner_id": current_user.id})
    
    # 5. Delete the user from MongoDB
    await users.delete_one({"_id": current_user.id})
    
    # Return 204 No Content (success)
    return