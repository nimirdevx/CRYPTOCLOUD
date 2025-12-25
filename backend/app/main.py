from fastapi import FastAPI
from .routes import auth_routes, file_routes, share_routes, profile_routes, public_share_routes
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .db import get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Create TTL index for automatic cleanup of expired public links
    db = get_db()
    if db is not None:
        try:
            # Create TTL index on expires_at field
            # MongoDB will automatically delete documents after expires_at timestamp
            await db.public_shares.create_index(
                "expires_at",
                expireAfterSeconds=0
            )
            print("✅ TTL index created for public_shares collection")
        except Exception as e:
            print(f"⚠️ Error creating TTL index: {e}")
    
    yield
    
    # Shutdown
    print("Application shutting down...")

app = FastAPI(title="CryptoCloud API", lifespan=lifespan)

app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(file_routes.router, prefix="/files", tags=["Files"])
app.include_router(share_routes.router, prefix="/share", tags=["Sharing"])
app.include_router(profile_routes.router, prefix="/profile", tags=["Profile"])
app.include_router(public_share_routes.router, prefix="/api", tags=["Public Sharing"])

origins = [
    "http://localhost:3000",
    # Add your NEW domain here exactly as it appears in the browser:
    "https://nimir-cryptocloud.vercel.app", 
    
    # (Optional) Keep the wildcard for future preview branches
    "https://*.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # <--- Updated list
    # allow_origins=["*"],   # ALTERNATIVE: Use this temporarily if you are stuck
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def read_root():
    return {"message": "Welcome to CryptoCloud"}
