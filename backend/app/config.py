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

    # EMAIL SETTINGS
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_STARTTLS: bool
    MAIL_SSL_TLS: bool
    
    
    class Config:
        env_file = ".env"

settings = Settings()