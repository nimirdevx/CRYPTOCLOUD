from fastapi import FastAPI
from .routes import auth_routes, file_routes, share_routes
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CryptoCloud API")

app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(file_routes.router, prefix="/files", tags=["Files"])
app.include_router(share_routes.router, prefix="/share", tags=["Sharing"])

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
