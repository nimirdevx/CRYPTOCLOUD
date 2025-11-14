from datetime import datetime, timedelta
from typing import Optional
import jwt
import hashlib
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..config import settings
from ..models.user_model import User
from ..db import get_user_collection
from bson import ObjectId

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def _prepare_password(password: str) -> bytes:
    """
    Prepare password for bcrypt by hashing it with SHA-256 if it's longer than 72 bytes.
    This allows us to support very long passwords (like encrypted ones from the frontend).
    """
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        # Hash the password with SHA-256 to ensure it's within bcrypt's limit
        return hashlib.sha256(password_bytes).hexdigest().encode('utf-8')
    return password_bytes

def verify_password(plain_password, hashed_password):
    prepared = _prepare_password(plain_password)
    return pwd_context.verify(prepared, hashed_password)

def get_password_hash(password):
    prepared = _prepare_password(password)
    return pwd_context.hash(prepared)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.jwt_exp)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm="HS256")
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user_collection = get_user_collection()
    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    return User(**user)
