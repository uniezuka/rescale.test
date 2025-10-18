"""
Pydantic models for image-related operations
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from uuid import UUID


class ProcessingStatus(str, Enum):
    """Image processing status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ImageCreate(BaseModel):
    """Model for creating a new image record"""
    filename: str = Field(..., description="Storage filename")
    original_filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type of the image")
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    original_url: str = Field(..., description="Public URL to original image")
    thumbnail_url: Optional[str] = Field(None, description="Public URL to thumbnail")
    
    @validator('file_size')
    def validate_file_size(cls, v):
        if v <= 0:
            raise ValueError('File size must be positive')
        if v > 10 * 1024 * 1024:  # 10MB
            raise ValueError('File size cannot exceed 10MB')
        return v
    
    @validator('mime_type')
    def validate_mime_type(cls, v):
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if v not in allowed_types:
            raise ValueError(f'MIME type must be one of: {", ".join(allowed_types)}')
        return v
    
    @validator('width', 'height')
    def validate_dimensions(cls, v):
        if v <= 0:
            raise ValueError('Width and height must be positive')
        if v > 10000:  # Reasonable max dimension
            raise ValueError('Width and height cannot exceed 10000 pixels')
        return v


class ImageUpdate(BaseModel):
    """Model for updating image metadata"""
    filename: Optional[str] = Field(None, description="Storage filename")
    original_filename: Optional[str] = Field(None, description="Original filename")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    mime_type: Optional[str] = Field(None, description="MIME type")
    width: Optional[int] = Field(None, description="Image width in pixels")
    height: Optional[int] = Field(None, description="Image height in pixels")
    ai_tags: Optional[List[str]] = Field(None, description="AI-generated tags")
    ai_description: Optional[str] = Field(None, description="AI-generated description")
    dominant_colors: Optional[List[str]] = Field(None, description="Dominant colors")
    processing_status: Optional[ProcessingStatus] = Field(None, description="Processing status")
    thumbnail_url: Optional[str] = Field(None, description="Public URL to thumbnail")
    original_url: Optional[str] = Field(None, description="Public URL to original image")
    
    @validator('file_size')
    def validate_file_size(cls, v):
        if v is not None and v <= 0:
            raise ValueError('File size must be positive')
        if v is not None and v > 10 * 1024 * 1024:  # 10MB
            raise ValueError('File size cannot exceed 10MB')
        return v
    
    @validator('mime_type')
    def validate_mime_type(cls, v):
        if v is not None:
            allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            if v not in allowed_types:
                raise ValueError(f'MIME type must be one of: {", ".join(allowed_types)}')
        return v
    
    @validator('width', 'height')
    def validate_dimensions(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Width and height must be positive')
        if v is not None and v > 10000:  # Reasonable max dimension
            raise ValueError('Width and height cannot exceed 10000 pixels')
        return v


class ImageResponse(BaseModel):
    """Model for image response - matches database schema exactly"""
    id: UUID = Field(..., description="Image ID")
    user_id: UUID = Field(..., description="User ID who owns the image")
    filename: str = Field(..., description="Storage filename")
    original_filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    uploaded_at: datetime = Field(..., description="Upload timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    processing_status: ProcessingStatus = Field(..., description="Processing status")
    ai_tags: Optional[List[str]] = Field(None, description="AI-generated tags")
    ai_description: Optional[str] = Field(None, description="AI-generated description")
    dominant_colors: Optional[List[str]] = Field(None, description="Dominant colors")
    thumbnail_url: Optional[str] = Field(None, description="Public URL to thumbnail")
    original_url: str = Field(..., description="Public URL to original image")
    
    class Config:
        from_attributes = True


class ImageListResponse(BaseModel):
    """Model for paginated image list response"""
    images: List[ImageResponse] = Field(..., description="List of images")
    total: int = Field(..., description="Total number of images")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Items per page")
    has_next: bool = Field(..., description="Whether there are more pages")
    has_prev: bool = Field(..., description="Whether there are previous pages")


class ImageUploadResponse(BaseModel):
    """Model for image upload response"""
    success: bool = Field(..., description="Upload success status")
    image_id: UUID = Field(..., description="Created image ID")
    message: str = Field(..., description="Response message")
    processing_started: bool = Field(..., description="Whether AI processing was started")


class AIProcessingResult(BaseModel):
    """Model for AI processing results"""
    tags: List[str] = Field(..., description="Generated tags")
    description: str = Field(..., description="Generated description")
    dominant_colors: List[str] = Field(..., description="Dominant colors")
    confidence_scores: Optional[Dict[str, float]] = Field(None, description="Confidence scores")
    processing_time: float = Field(..., description="Processing time in seconds")


class ImageDeleteResponse(BaseModel):
    """Model for image deletion response"""
    success: bool = Field(..., description="Deletion success status")
    message: str = Field(..., description="Response message")
    deleted_files: List[str] = Field(..., description="List of deleted file paths")
