import os
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
    database_url: str = "sqlite:///./instagram_clone.db"
    
    # JWT
    secret_key: str = "your-super-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day
    refresh_token_expire_days: int = 30  # 30 days
    
    # File Upload
    upload_dir: str = "uploads"
    max_file_size: int = 10485760  # 10MB
    
    # CORS - will be set dynamically based on environment
    frontend_url: str = "http://localhost:3000"
    
    # Admin
    admin_password: str = "admin123"
    
    # Server
    host: str = "127.0.0.1"
    port: int = 8000
    
    # Debug and Logging - auto-configured based on environment
    @property
    def debug(self) -> bool:
        """Enable debug mode in development"""
        return self.environment == "development"
    
    @property
    def log_level(self) -> str:
        """Set log level based on environment"""
        if self.environment == "development":
            return "DEBUG"
        elif self.environment == "staging":
            return "INFO"
        else:  # production
            return "WARNING"
    
    @property
    def cors_origins(self) -> List[str]:
        """Set CORS origins based on environment"""
        if self.environment == "development":
            # Allow all common development ports
            return [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:5175",
            ]
        elif self.environment == "staging":
            # Staging URLs
            return [
                self.frontend_url,
                "https://staging.yourdomain.com"
            ]
        else:  # production
            # Production URLs only
            return [
                "https://yourdomain.com",
                "https://www.yourdomain.com"
            ]
    
    @property
    def cors_allow_credentials(self) -> bool:
        """Allow credentials in CORS"""
        return True
    
    @property
    def cors_allow_methods(self) -> List[str]:
        """Allowed HTTP methods"""
        return ["*"] if self.environment == "development" else ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    
    @property
    def cors_allow_headers(self) -> List[str]:
        """Allowed headers"""
        return ["*"] if self.environment == "development" else ["Authorization", "Content-Type"]
    
    @property
    def show_docs(self) -> bool:
        """Show API documentation (Swagger/ReDoc)"""
        return self.environment != "production"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()

# Helper function to check environment
def is_development() -> bool:
    """Check if running in development mode"""
    settings = get_settings()
    return settings.environment == "development"

def is_production() -> bool:
    """Check if running in production mode"""
    settings = get_settings()
    return settings.environment == "production"

def is_staging() -> bool:
    """Check if running in staging mode"""
    settings = get_settings()
    return settings.environment == "staging"