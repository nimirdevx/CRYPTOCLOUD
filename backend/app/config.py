from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongo_uri: str
    secret_key: str  # For JWT
    jwt_exp: int
    
    # OLD KEY - DELETE THIS LINE:
    # master_key_base64: str 

    # NEW S3 SETTINGS:
    aws_access_key_id: str
    aws_secret_access_key: str
    s3_bucket_name: str
    s3_region: str

    class Config:
        env_file = ".env"

settings = Settings()