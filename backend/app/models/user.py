"""
Pydantic models for user-related operations
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class UserResponse(BaseModel):
    """Model for user response"""
    id: str = Field(..., description="User ID")
    email: EmailStr = Field(..., description="User email")
    created_at: datetime = Field(..., description="Account creation timestamp")
    last_sign_in: Optional[datetime] = Field(None, description="Last sign in timestamp")
    
    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """Model for user statistics"""
    total_images: int = Field(..., description="Total number of images uploaded")
    total_size: int = Field(..., description="Total storage used in bytes")
    ai_processed_images: int = Field(..., description="Number of images processed by AI")
    failed_processing: int = Field(..., description="Number of failed AI processing attempts")
    last_upload: Optional[datetime] = Field(None, description="Last upload timestamp")
