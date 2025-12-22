import pyotp
import qrcode
import io
import base64
import smtplib # <--- Standard Library (Proven to work)
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..utils.file_utils import s3_client, recursive_delete
import secrets
from fastapi import APIRouter, HTTPException, status, Depends, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime, timedelta

from ..models.user_model import UserCreate, User, UserResponse
from ..utils.auth import (
    get_password_hash, verify_password, create_access_token, get_current_user,
    jwt
)
from ..utils.auth import create_access_token as create_reset_token 
from ..db import get_user_collection, get_file_collection, get_shared_files_collection
from ..config import settings
from ..routes.file_routes import recursive_delete

router = APIRouter()

# --- Pydantic Models ---
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

# --- HELPER: Send Email using Standard SMTP (The "Proven" Way) ---
def send_email_smtp(to_email: str, subject: str, html_content: str):
    """
    Sends an email using standard smtplib (Synchronous).
    We run this in a background task to avoid blocking the API.
    """
    try:
        print(f"Attempting to send email to {to_email} via Port 465...")
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = settings.MAIL_FROM
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html'))

        # Connect using SSL (Port 465) - Exactly like your test script
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"✅ Email sent successfully to {to_email}")
    except Exception as e:
        print(f"❌ SMTP Error: {e}")

# --- ROUTES ---

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, users: AsyncIOMotorCollection = Depends(get_user_collection)):
    existing_user = await users.find_one({
        "$or": [{"username": user.username}, {"email": user.email}]
    })
    if existing_user:
        detail = "Username already registered" if existing_user["username"] == user.username else "Email already registered"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
        
    hashed_password = get_password_hash(user.password)
    
    new_user_data = {
        "username": user.username, 
        "hashed_password": hashed_password,
        "email": user.email,
        "is_2fa_enabled": False, 
        "totp_secret": None,
        "publicKey": user.publicKey,
        "encryptedPrivateKey": user.encryptedPrivateKey,
        "backup_codes": None
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"})

    if user_doc.get("is_2fa_enabled", False):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="2FA_REQUIRED")

    access_token = create_access_token(data={"sub": str(user_doc["_id"])})
    return {"access_token": access_token, "token_type": "bearer", "is_2fa_enabled": False}

@router.post("/2fa/login")
async def login_2fa(request: TwoFaLoginRequest, users: AsyncIOMotorCollection = Depends(get_user_collection)):
    user_doc = await users.find_one({"username": request.username})
    if not user_doc or not verify_password(request.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    if not user_doc.get("is_2fa_enabled") or not user_doc.get("totp_secret"):
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled for this account")
        
    totp = pyotp.TOTP(user_doc["totp_secret"])
    if totp.verify(request.totp_code):
        access_token = create_access_token(data={"sub": str(user_doc["_id"])})
        return {"access_token": access_token, "token_type": "bearer", "is_2fa_enabled": True}

    hashed_backup_codes = user_doc.get("backup_codes", [])
    for hashed_code in hashed_backup_codes:
        if verify_password(request.totp_code, hashed_code):
            await users.update_one({"_id": user_doc["_id"]}, {"$pull": {"backup_codes": hashed_code}})
            access_token = create_access_token(data={"sub": str(user_doc["_id"])})
            return {"access_token": access_token, "token_type": "bearer", "is_2fa_enabled": True}

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA code or backup code")

@router.post("/2fa/generate", response_model=dict)
async def generate_2fa(current_user: User = Depends(get_current_user), users: AsyncIOMotorCollection = Depends(get_user_collection)):
    secret = pyotp.random_base32()
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.username, issuer_name="CryptoCloud")
    await users.update_one({"_id": current_user.id}, {"$set": {"totp_secret": secret, "is_2fa_enabled": False}})
    img = qrcode.make(totp_uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return {"qr_code_data_url": f"data:image/png;base64,{qr_base64}", "secret": secret}

@router.post("/2fa/verify", response_model=dict)
async def verify_2fa(request: TwoFaCode, current_user: User = Depends(get_current_user), users: AsyncIOMotorCollection = Depends(get_user_collection)):
    user_doc = await users.find_one({"_id": current_user.id})
    if not user_doc.get("totp_secret") or not pyotp.TOTP(user_doc["totp_secret"]).verify(request.totp_code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code.")
    await users.update_one({"_id": current_user.id}, {"$set": {"is_2fa_enabled": True}})
    return {"message": "2FA enabled successfully!"}

@router.post("/2fa/disable", status_code=status.HTTP_204_NO_CONTENT)
async def disable_2fa(request: PasswordVerifyRequest, current_user: User = Depends(get_current_user), users: AsyncIOMotorCollection = Depends(get_user_collection)):
    user_doc = await users.find_one({"_id": current_user.id})
    if not verify_password(request.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    await users.update_one({"_id": current_user.id}, {"$set": {"is_2fa_enabled": False, "totp_secret": None, "backup_codes": None}})
    return

@router.post("/2fa/generate-backup-codes", response_model=List[str])
async def generate_backup_codes(request: PasswordVerifyRequest, current_user: User = Depends(get_current_user), users: AsyncIOMotorCollection = Depends(get_user_collection)):
    user_doc = await users.find_one({"_id": current_user.id})
    if not verify_password(request.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    if not user_doc.get("is_2fa_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled.")
    plain_text_codes = [f"{secrets.randbelow(10000):04}-{secrets.randbelow(10000):04}" for _ in range(10)]
    hashed_codes = [get_password_hash(code) for code in plain_text_codes]
    await users.update_one({"_id": current_user.id}, {"$set": {"backup_codes": hashed_codes}})
    return plain_text_codes

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(request: DeleteAccountRequest, current_user: User = Depends(get_current_user), users: AsyncIOMotorCollection = Depends(get_user_collection), files: AsyncIOMotorCollection = Depends(get_file_collection)):
    user_doc = await users.find_one({"_id": current_user.id})
    if not verify_password(request.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    user_files = await files.find({"owner_id": current_user.id}).to_list(length=None)
    if user_files:
        s3_keys = [{"Key": f["file_path"]} for f in user_files if f.get("file_path")]
        if s3_keys:
            try: s3_client.delete_objects(Bucket=settings.s3_bucket_name, Delete={'Objects': s3_keys})
            except: pass
    await files.delete_many({"owner_id": current_user.id})
    await users.delete_one({"_id": current_user.id})
    return

@router.post("/verify-password", status_code=status.HTTP_204_NO_CONTENT)
async def verify_password_for_session(request: PasswordVerifyRequest, current_user: User = Depends(get_current_user), users: AsyncIOMotorCollection = Depends(get_user_collection)):
    user_doc = await users.find_one({"_id": current_user.id})
    if not verify_password(request.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    return

@router.get("/me/keys", response_model=UserKeysResponse)
async def get_user_keys(current_user: User = Depends(get_current_user), users: AsyncIOMotorCollection = Depends(get_user_collection)):
    user_doc = await users.find_one({"_id": current_user.id})
    if not user_doc: raise HTTPException(status_code=404, detail="User not found")
    return UserKeysResponse(publicKey=user_doc.get("publicKey"), encryptedPrivateKey=user_doc.get("encryptedPrivateKey"))

# --- 4. UPDATED: Password Reset Using BackgroundTasks + SMTP ---

@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks, # <--- Use BackgroundTasks
    users: AsyncIOMotorCollection = Depends(get_user_collection)
):
    """
    Checks if a user exists and sends them a password reset email via standard SMTP.
    """
    user = await users.find_one({"email": request.email})
    
    if user:
        token_data = {"sub": str(user["_id"]), "scope": "password_reset"}
        token_exp = timedelta(minutes=20)
        reset_token = create_reset_token(token_data, expires_delta=token_exp)
        
        # Use the dynamic Vercel URL if possible, otherwise fallback
        # Ideally, pass the frontend URL from environment, but hardcoding the known working one is fine for now
        reset_link = f"https://nimir-cryptocloud.vercel.app/auth/reset-password?token={reset_token}"
        
        email_body = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif;">
            <h2>CryptoCloud Password Reset</h2>
            <p>Hi {user['username']},</p>
            <p>You requested to reset your password. <strong>Warning: This will delete all your files!</strong></p>
            <p><a href="{reset_link}" style="background: red; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password & Delete Data</a></p>
            <p>If you didn't request this, ignore this email.</p>
        </body>
        </html>
        """
        
        # Add the send_email_smtp function to background tasks
        background_tasks.add_task(send_email_smtp, user["email"], "Reset Your Password", email_body)
            
    return {"message": "If an account with that email exists, a reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(
    request: ResetPasswordRequest,
    users: AsyncIOMotorCollection = Depends(get_user_collection),
    files: AsyncIOMotorCollection = Depends(get_file_collection),
    shared_files: AsyncIOMotorCollection = Depends(get_shared_files_collection)
):
    from bson import ObjectId
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(request.token, settings.secret_key, algorithms=["HS256"])
        user_id_str: str = payload.get("sub")
        scope: str = payload.get("scope")
        if user_id_str is None or scope != "password_reset": raise credentials_exception
        user_id = ObjectId(user_id_str)
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await users.find_one({"_id": user_id})
    if not user: raise HTTPException(status_code=404, detail="User not found")
        
    user_items = await files.find({"owner_id": user_id}).to_list(length=None)
    for item in user_items:
        await recursive_delete(item["_id"], user_id, files) 
        
    await shared_files.delete_many({"$or": [{"owner_id": user_id}, {"recipient_id": user_id}]})
    
    new_hashed_password = get_password_hash(request.new_password)
    
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