"""
Configuration settings for FastAPI application
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Supabase Configuration
    supabase_url: str
    supabase_key: str
    supabase_anon_key: str
    
    # Azure Computer Vision
    azure_vision_endpoint: str
    azure_vision_key: str
    
    # Background Processing Configuration
    max_concurrent_tasks: int = 5
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # API Configuration
    api_v1_str: str = "/api/v1"
    project_name: str = "AI Image Gallery"
    
    # CORS Configuration
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    allowed_hosts: List[str] = ["*"]
    
    # File Upload Configuration
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: List[str] = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    
    # AI Processing Configuration
    ai_processing_timeout: int = 300  # 5 minutes
    
    # Rate Limiting (Azure Computer Vision Free Tier)
    rate_limit_per_minute: int = 20
    rate_limit_per_day: int = 150
    rate_limit_per_month: int = 4000
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Create settings instance
settings = Settings()

# Validate required settings
def validate_settings():
    """Validate that all required settings are present"""
    required_settings = [
        "supabase_url",
        "supabase_key", 
        "azure_vision_endpoint",
        "azure_vision_key"
    ]
    
    missing_settings = []
    for setting in required_settings:
        if not getattr(settings, setting, None):
            missing_settings.append(setting)
    
    if missing_settings:
        raise ValueError(f"Missing required settings: {', '.join(missing_settings)}")


# Validate on import
validate_settings()
