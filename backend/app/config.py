from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongo_uri: str
    secret_key: str
    master_key_base64: str
    jwt_exp: int

    class Config:
        env_file = ".env"

settings = Settings()
