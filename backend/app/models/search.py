"""
Pydantic models for search-related operations
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class SearchFilters(BaseModel):
    """Model for search filters"""
    query: Optional[str] = Field(None, description="Text search query")
    color: Optional[str] = Field(None, description="Color filter (hex code)")
    tags: Optional[List[str]] = Field(None, description="Tag filters")
    date_from: Optional[datetime] = Field(None, description="Upload date from")
    date_to: Optional[datetime] = Field(None, description="Upload date to")
    min_size: Optional[int] = Field(None, description="Minimum file size")
    max_size: Optional[int] = Field(None, description="Maximum file size")
    mime_types: Optional[List[str]] = Field(None, description="MIME type filters")
    
    @validator('color')
    def validate_color(cls, v):
        if v and not v.startswith('#'):
            v = f"#{v}"
        if v and len(v) != 7:
            raise ValueError('Color must be a valid hex code (e.g., #FF0000)')
        return v
    
    @validator('min_size', 'max_size')
    def validate_size(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Size must be positive')
        return v


class SearchRequest(BaseModel):
    """Model for search request"""
    filters: SearchFilters = Field(..., description="Search filters")
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(20, ge=1, le=100, description="Items per page")
    sort_by: str = Field("created_at", description="Sort field")
    sort_order: str = Field("desc", description="Sort order (asc/desc)")
    
    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('Sort order must be "asc" or "desc"')
        return v


class SearchResponse(BaseModel):
    """Model for search response"""
    images: List[Dict[str, Any]] = Field(..., description="Search results")
    total: int = Field(..., description="Total number of results")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Items per page")
    has_next: bool = Field(..., description="Whether there are more pages")
    has_prev: bool = Field(..., description="Whether there are previous pages")
    search_time: float = Field(..., description="Search execution time in seconds")
    facets: Optional[Dict[str, Any]] = Field(None, description="Search facets/aggregations")


class SimilarImageRequest(BaseModel):
    """Model for similar image search request"""
    image_id: UUID = Field(..., description="Source image ID")
    limit: int = Field(10, ge=1, le=50, description="Number of similar images to return")
    similarity_threshold: float = Field(0.7, ge=0.0, le=1.0, description="Minimum similarity score")


class SimilarImageResponse(BaseModel):
    """Model for similar image search response"""
    source_image_id: UUID = Field(..., description="Source image ID")
    similar_images: List[Dict[str, Any]] = Field(..., description="Similar images with scores")
    search_time: float = Field(..., description="Search execution time in seconds")


class SearchSuggestions(BaseModel):
    """Model for search suggestions"""
    query: str = Field(..., description="Search query")
    suggestions: List[str] = Field(..., description="Suggested search terms")
    popular_tags: List[str] = Field(..., description="Popular tags")
    recent_searches: List[str] = Field(..., description="Recent search queries")
