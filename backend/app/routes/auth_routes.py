import pyotp
import qrcode
import io
import base64
from ..utils.file_utils import s3_client, recursive_delete
import secrets
from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime, timedelta

# --- 1. ADD NEW IMPORTS ---
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

from ..models.user_model import UserCreate, User, UserResponse
from ..utils.auth import (
    get_password_hash, verify_password, create_access_token, get_current_user,
    jwt # Import the jwt library
)
# Use a separate alias for the reset token
from ..utils.auth import create_access_token as create_reset_token 
from ..db import get_user_collection, get_file_collection, get_shared_files_collection
from ..config import settings
from ..routes.file_routes import recursive_delete # Import the delete helper

router = APIRouter()

# --- 2. ADD Pydantic Models ---
class TwoFaCode(BaseModel):
    totp_code: str

class TwoFaLoginRequest(BaseModel):
    username: str
    password: str
    totp_code: str

class UserKeysResponse(BaseModel):
    publicKey: Optional[str] = None
    encryptedPrivateKey: Optional[str] = None

class DeleteAccountRequest(BaseModel):
    password: str
    
class PasswordVerifyRequest(BaseModel):
    password: str
    
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    publicKey: str
    encryptedPrivateKey: str

# --- 3. CONFIGURE FASTAPI-MAIL ---
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=False,  # Force False for Port 465
    MAIL_SSL_TLS=True,    # Force True for Port 465
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True   # Keep this True for security
)

fm = FastMail(conf)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, users: AsyncIOMotorCollection = Depends(get_user_collection)):
    
    # Check for existing username OR email
    existing_user = await users.find_one({
        "$or": [
            {"username": user.username},
            {"email": user.email}
        ]
    })
    if existing_user:
        if existing_user["username"] == user.username:
            detail = "Username already registered"
        else:
            detail = "Email already registered"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )
        
    hashed_password = get_password_hash(user.password)
    
    new_user_data = {
        "username": user.username, 
        "hashed_password": hashed_password,
        "email": user.email, # <-- Add email
        "is_2fa_enabled": False, 
        "totp_secret": None,
        "publicKey": user.publicKey,
        "encryptedPrivateKey": user.encryptedPrivateKey,
        "backup_codes": None # Explicitly set to None
    }
    
    new_user = await users.insert_one(new_user_data)
    created_user = await users.find_one({"_id": new_user.inserted_id})
    
    return UserResponse(
        id=str(created_user["_id"]), 
        username=created_user["username"], 
        is_2fa_enabled=created_user["is_2fa_enabled"]
    )


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), users: AsyncIOMotorCollection = Depends(get_user_collection)):
    
    user_doc = await users.find_one({"username": form_data.username})

    if not user_doc or not verify_password(form_data.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user_doc.get("is_2fa_enabled", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="2FA_REQUIRED",
        )

    access_token = create_access_token(data={"sub": str(user_doc["_id"])})

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "is_2fa_enabled": False
    }

@router.post("/2fa/login")
async def login_2fa(request: TwoFaLoginRequest, users: AsyncIOMotorCollection = Depends(get_user_collection)):
    
    user_doc = await users.find_one({"username": request.username})

    if not user_doc or not verify_password(request.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not user_doc.get("is_2fa_enabled") or not user_doc.get("totp_secret"):
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled for this account",
        )
        
    # Try TOTP verification
    totp = pyotp.TOTP(user_doc["totp_secret"])
    if totp.verify(request.totp_code):
        access_token = create_access_token(data={"sub": str(user_doc["_id"])})
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "is_2fa_enabled": True
        }

    # If TOTP fails, try to verify as a backup code
    hashed_backup_codes = user_doc.get("backup_codes", [])
    found_match = False
    matched_hash = None

    for hashed_code in hashed_backup_codes:
        if verify_password(request.totp_code, hashed_code):
            found_match = True
            matched_hash = hashed_code
            break
    
    if found_match:
        await users.update_one(
            {"_id": user_doc["_id"]},
            {"$pull": {"backup_codes": matched_hash}}
        )
        access_token = create_access_token(data={"sub": str(user_doc["_id"])})
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "is_2fa_enabled": True
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid 2FA code or backup code",
    )

@router.post("/2fa/generate", response_model=dict)
async def generate_2fa(
    current_user: User = Depends(get_current_user), 
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    # ... (function is unchanged)
    secret = pyotp.random_base32()
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.username, 
        issuer_name="CryptoCloud"
    )
    await users.update_one(
        {"_id": current_user.id}, 
        {"$set": {"totp_secret": secret, "is_2fa_enabled": False}}
    )
    img = qrcode.make(totp_uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return {"qr_code_data_url": f"data:image/png;base64,{qr_base64}", "secret": secret}

@router.post("/2fa/verify", response_model=dict)
async def verify_2fa(
    request: TwoFaCode,
    current_user: User = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    # ... (function is unchanged)
    user_doc = await users.find_one({"_id": current_user.id})
    secret = user_doc.get("totp_secret")
    if not secret:
        raise HTTPException(status_code=400, detail="No 2FA secret found.")
    totp = pyotp.TOTP(secret)
    if not totp.verify(request.totp_code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code.")
    await users.update_one(
        {"_id": current_user.id},
        {"$set": {"is_2fa_enabled": True}}
    )
    return {"message": "2FA enabled successfully!"}

@router.post("/2fa/disable", status_code=status.HTTP_204_NO_CONTENT)
async def disable_2fa(
    request: PasswordVerifyRequest,
    current_user: User = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    # ... (function is unchanged)
    user_doc = await users.find_one({"_id": current_user.id})
    if not verify_password(request.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    await users.update_one(
        {"_id": current_user.id},
        {"$set": {"is_2fa_enabled": False, "totp_secret": None, "backup_codes": None}}
    )
    return

@router.post("/2fa/generate-backup-codes", response_model=List[str])
async def generate_backup_codes(
    request: PasswordVerifyRequest,
    current_user: User = Depends(get_current_user), 
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    # ... (function is unchanged)
    user_doc = await users.find_one({"_id": current_user.id})
    if not verify_password(request.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    if not user_doc.get("is_2fa_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled.")
    plain_text_codes = []
    hashed_codes = []
    for _ in range(10):
        code = f"{secrets.randbelow(10000):04}-{secrets.randbelow(10000):04}"
        plain_text_codes.append(code)
        hashed_codes.append(get_password_hash(code))
    await users.update_one(
        {"_id": current_user.id},
        {"$set": {"backup_codes": hashed_codes}}
    )
    return plain_text_codes

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    request: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_user_collection),
    files: AsyncIOMotorCollection = Depends(get_file_collection)
):
    # ... (function is unchanged)
    user_doc = await users.find_one({"_id": current_user.id})
    if not verify_password(request.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    user_files = await files.find({"owner_id": current_user.id}).to_list(length=None)
    if user_files:
        s3_keys_to_delete = [{"Key": f["file_path"]} for f in user_files if f.get("file_path")]
        if s3_keys_to_delete:
            try:
                s3_client.delete_objects(
                    Bucket=settings.s3_bucket_name,
                    Delete={'Objects': s3_keys_to_delete}
                )
            except Exception as e:
                print(f"Error deleting S3 objects for user {current_user.id}: {e}")
    await files.delete_many({"owner_id": current_user.id})
    await users.delete_one({"_id": current_user.id})
    return

@router.post("/verify-password", status_code=status.HTTP_204_NO_CONTENT)
async def verify_password_for_session(
    request: PasswordVerifyRequest,
    current_user: User = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    # ... (function is unchanged)
    user_doc = await users.find_one({"_id": current_user.id})
    if not verify_password(request.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    return

@router.get("/me/keys", response_model=UserKeysResponse)
async def get_user_keys(
    current_user: User = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    # ... (function is unchanged)
    user_doc = await users.find_one({"_id": current_user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return UserKeysResponse(
        publicKey=user_doc.get("publicKey"),
        encryptedPrivateKey=user_doc.get("encryptedPrivateKey")
    )

# --- 4. ADD THE NEW PASSWORD RESET ENDPOINTS ---

@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(
    request: ForgotPasswordRequest,
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    """
    Checks if a user exists and sends them a password reset email.
    """
    user = await users.find_one({"email": request.email})
    
    if user:
        token_data = {"sub": str(user["_id"]), "scope": "password_reset"}
        token_exp = timedelta(minutes=20)
        reset_token = create_reset_token(token_data, expires_delta=token_exp)
        
        reset_link = f"http://localhost:3000/auth/reset-password?token={reset_token}"
        
        email_body = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - CryptoCloud</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 40px 0;">
                <tr>
                    <td align="center" style="padding: 0;">
                        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                            
                            <tr>
                                <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                        🔐 CryptoCloud
                                    </h1>
                                </td>
                            </tr>
                            
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 600;">
                                        Password Reset Request
                                    </h2>
                                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                        Hi <strong style="color: #111827;">{user['username']}</strong>,
                                    </p>
                                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                        We received a request to reset the password for your CryptoCloud account.
                                    </p>

                                    <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                                        <p style="margin: 0; color: #d97706; font-size: 15px; line-height: 1.6;">
                                            <strong style="display: block; margin-bottom: 4px; color: #b45309; font-size: 16px;">
                                                EXTREMELY IMPORTANT
                                            </strong>
                                            Due to your app's zero-knowledge security model, resetting your password
                                            will **permanently delete all of your encrypted files, folders, and shares.**
                                            <br><br>
                                            This action is irreversible.
                                        </p>
                                    </div>
                                    
                                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                        If you understand and wish to proceed, click the button below. This link is valid for 20 minutes.
                                    </p>
                                    
                                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                                        <tr>
                                            <td align="center">
                                                <a href="{reset_link}" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                                                    Delete All Data & Reset Password
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <tr>
                                <td style="background-color: #f9fafb; padding: 24px 30px; border-top: 1px solid #e5e7eb;">
                                    <p style="margin: 0 0 12px 0; color: #111827; font-size: 14px; font-weight: 600;">
                                        🛡️ Didn't request this?
                                    </p>
                                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                        If you didn't request a password reset, you can safely ignore this email. Your account and files are secure.
                                    </p>
                                </td>
                            </tr>
                            
                            <tr>
                                <td style="background-color: #111827; padding: 30px; text-align: center;">
                                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                        © 2025 CryptoCloud. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        message = MessageSchema(
            subject="Your CryptoCloud Password Reset",
            recipients=[user["email"]],
            body=email_body,
            subtype="html"
        )
        
        try:
            await fm.send_message(message)
        except Exception as e:
            print(f"Error sending email: {e}")
            pass 
            
    return {"message": "If an account with that email exists, a reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(
    request: ResetPasswordRequest,
    users: AsyncIOMotorCollection = Depends(get_user_collection),
    files: AsyncIOMotorCollection = Depends(get_file_collection),
    shared_files: AsyncIOMotorCollection = Depends(get_shared_files_collection)
):
    """
    Verifies a password reset token and resets the user's password.
    This is DESTRUCTIVE and will wipe all user data.
    """
    from bson import ObjectId
    
    # Define the exception locally for token validation
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            request.token, 
            settings.secret_key, 
            algorithms=["HS256"]
        )
        user_id_str: str = payload.get("sub")
        scope: str = payload.get("scope")
        
        if user_id_str is None or scope != "password_reset":
            raise credentials_exception
        
        user_id = ObjectId(user_id_str)
        
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # --- THIS IS THE DESTRUCTIVE PART ---
    user_items = await files.find({"owner_id": user_id}).to_list(length=None)
    for item in user_items:
        await recursive_delete(item["_id"], user_id, files) 
        
    await shared_files.delete_many({
        "$or": [{"owner_id": user_id}, {"recipient_id": user_id}]
    })

    # 3. Hash the new password
    new_hashed_password = get_password_hash(request.new_password)
    
    # 4. Save the new password AND set up the new encryption keys
    await users.update_one(
        {"_id": user_id},
        {"$set": {
            "hashed_password": new_hashed_password,
            "is_2fa_enabled": False,
            "totp_secret": None,
            "backup_codes": None,
            "publicKey": request.publicKey,
            "encryptedPrivateKey": request.encryptedPrivateKey
        }}
    )
    
    return