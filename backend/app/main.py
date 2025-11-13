from fastapi import FastAPI
from .routes import auth_routes, file_routes
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CryptoCloud API")

app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(file_routes.router, prefix="/files", tags=["Files"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # The origin of your Next.js app
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers (Content-Type, Authorization, etc.)
)

@app.get("/")
def read_root():
    return {"message": "Welcome to CryptoCloud"}
