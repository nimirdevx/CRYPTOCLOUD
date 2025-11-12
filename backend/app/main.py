from fastapi import FastAPI
from .routes import auth_routes, file_routes

app = FastAPI(title="CryptoCloud API")

app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(file_routes.router, prefix="/files", tags=["Files"])

@app.get("/")
def read_root():
    return {"message": "Welcome to CryptoCloud"}
