from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from ..models.user_model import UserCreate, User, UserResponse
from ..utils.auth import get_password_hash, verify_password, create_access_token
from ..db import get_user_collection
from motor.motor_asyncio import AsyncIOMotorCollection

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, users: AsyncIOMotorCollection = Depends(get_user_collection)):
    existing_user = await users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    hashed_password = get_password_hash(user.password)
    new_user = await users.insert_one({"username": user.username, "hashed_password": hashed_password})
    created_user = await users.find_one({"_id": new_user.inserted_id})
    return UserResponse(id=str(created_user["_id"]), username=created_user["username"])

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), users: AsyncIOMotorCollection = Depends(get_user_collection)):
    user = await users.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": str(user["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}
