"""
Search API endpoints
"""

import time
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import text
from uuid import UUID

from app.auth import get_current_user
from app.models.search import (
    SearchRequest, SearchResponse, SearchFilters, 
    SimilarImageRequest, SimilarImageResponse, SearchSuggestions
)
from app.models.user import UserResponse
from app.database import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/images", response_model=SearchResponse)
async def search_images(
    q: Optional[str] = Query(None, description="Text search query"),
    color: Optional[str] = Query(None, description="Color filter (hex code)"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Search images by text, color, and other filters
    
    Args:
        q: Text search query
        color: Color filter (hex code)
        tags: Comma-separated tags
        page: Page number
        limit: Items per page
        sort_by: Sort field
        sort_order: Sort order
        current_user: Authenticated user
        
    Returns:
        SearchResponse with search results
    """
    start_time = time.time()
    
    try:
        supabase = get_supabase_client()
        
        # Build query
        query = supabase.table('images').select('*', count='exact').eq('user_id', current_user.id)
        
        # Apply text search
        if q:
            # Search in AI description and tags
            query = query.or_(f"ai_description.ilike.%{q}%,ai_tags.cs.{{{q}}}")
        
        # Apply color filter
        if color:
            if not color.startswith('#'):
                color = f"#{color}"
            query = query.contains('dominant_colors', [color])
        
        # Apply tag filter
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
            if tag_list:
                query = query.overlaps('ai_tags', tag_list)
        
        # Apply sorting
        if sort_order.lower() == 'asc':
            query = query.order(sort_by)
        else:
            query = query.order(sort_by, desc=True)
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
        
        # Execute query
        result = query.execute()
        
        if not result.data:
            return SearchResponse(
                images=[],
                total=0,
                page=page,
                limit=limit,
                has_next=False,
                has_prev=False,
                search_time=time.time() - start_time
            )
        
        # Process results
        images = []
        for image in result.data:
            images.append({
                "id": image['id'],
                "filename": image['original_filename'],
                "storage_path": image['storage_path'],
                "thumbnail_path": image.get('thumbnail_path'),
                "public_url": image.get('original_url'),
                "thumbnail_url": image.get('thumbnail_url'),
                "ai_tags": image.get('ai_tags', []),
                "ai_description": image.get('ai_description'),
                "dominant_colors": image.get('dominant_colors', []),
                "processing_status": image['processing_status'],
                "created_at": image['created_at'],
                "updated_at": image['updated_at']
            })
        
        total = result.count or 0
        has_next = offset + limit < total
        has_prev = page > 1
        
        return SearchResponse(
            images=images,
            total=total,
            page=page,
            limit=limit,
            has_next=has_next,
            has_prev=has_prev,
            search_time=time.time() - start_time
        )
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed"
        )


@router.get("/images/{image_id}/similar", response_model=SimilarImageResponse)
async def find_similar_images(
    image_id: UUID,
    limit: int = Query(10, ge=1, le=50, description="Number of similar images"),
    similarity_threshold: float = Query(0.7, ge=0.0, le=1.0, description="Minimum similarity score"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Find similar images based on AI analysis
    
    Args:
        image_id: ID of the source image
        limit: Number of similar images to return
        similarity_threshold: Minimum similarity score
        current_user: Authenticated user
        
    Returns:
        SimilarImageResponse with similar images
    """
    start_time = time.time()
    
    try:
        supabase = get_supabase_client()
        
        # Get source image
        source_result = supabase.table('images').select('*').eq('id', image_id).single().execute()
        
        if not source_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source image not found"
            )
        
        source_image = source_result.data
        
        # Check ownership
        if source_image['user_id'] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this image"
            )
        
        # Check if source image has AI analysis
        if not source_image.get('ai_tags') or not source_image.get('ai_description'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source image must have AI analysis completed"
            )
        
        # Get all other images with AI analysis
        all_images_result = supabase.table('images').select('*').eq(
            'user_id', current_user.id
        ).neq('id', image_id).not_.is_('ai_tags', 'null').not_.is_('ai_description', 'null').execute()
        
        if not all_images_result.data:
            return SimilarImageResponse(
                source_image_id=image_id,
                similar_images=[],
                search_time=time.time() - start_time
            )
        
        # Calculate similarity scores
        similar_images = []
        source_tags = set(source_image.get('ai_tags', []))
        source_description = source_image.get('ai_description', '').lower()
        
        for image in all_images_result.data:
            # Calculate tag similarity
            image_tags = set(image.get('ai_tags', []))
            tag_similarity = len(source_tags.intersection(image_tags)) / len(source_tags.union(image_tags)) if source_tags or image_tags else 0
            
            # Calculate description similarity (simple word overlap)
            image_description = image.get('ai_description', '').lower()
            source_words = set(source_description.split())
            image_words = set(image_description.split())
            desc_similarity = len(source_words.intersection(image_words)) / len(source_words.union(image_words)) if source_words or image_words else 0
            
            # Combined similarity score
            combined_similarity = (tag_similarity * 0.7) + (desc_similarity * 0.3)
            
            if combined_similarity >= similarity_threshold:
                similar_images.append({
                    "id": image['id'],
                    "filename": image['original_filename'],
                    "thumbnail_url": image.get('thumbnail_url'),
                    "similarity_score": round(combined_similarity, 3),
                    "tag_similarity": round(tag_similarity, 3),
                    "description_similarity": round(desc_similarity, 3),
                    "ai_tags": image.get('ai_tags', []),
                    "ai_description": image.get('ai_description'),
                    "created_at": image['created_at']
                })
        
        # Sort by similarity score and limit results
        similar_images.sort(key=lambda x: x['similarity_score'], reverse=True)
        similar_images = similar_images[:limit]
        
        return SimilarImageResponse(
            source_image_id=image_id,
            similar_images=similar_images,
            search_time=time.time() - start_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Similar image search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Similar image search failed"
        )


@router.get("/suggestions", response_model=SearchSuggestions)
async def get_search_suggestions(
    query: str = Query(..., description="Search query"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get search suggestions based on query
    
    Args:
        query: Search query
        current_user: Authenticated user
        
    Returns:
        SearchSuggestions with suggestions
    """
    try:
        supabase = get_supabase_client()
        
        # Get popular tags
        tags_result = supabase.table('images').select('ai_tags').eq(
            'user_id', current_user.id
        ).not_.is_('ai_tags', 'null').execute()
        
        popular_tags = []
        if tags_result.data:
            all_tags = []
            for image in tags_result.data:
                all_tags.extend(image.get('ai_tags', []))
            
            # Count tag frequency
            tag_counts = {}
            for tag in all_tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
            
            # Get top 10 tags
            popular_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            popular_tags = [tag for tag, count in popular_tags]
        
        # Generate suggestions based on query
        suggestions = []
        if query:
            # Simple suggestion logic - in a real app, you might use more sophisticated algorithms
            suggestions = [tag for tag in popular_tags if query.lower() in tag.lower()][:5]
        
        # Get recent searches (you might want to store this in a separate table)
        recent_searches = []  # Placeholder - implement if needed
        
        return SearchSuggestions(
            query=query,
            suggestions=suggestions,
            popular_tags=popular_tags,
            recent_searches=recent_searches
        )
        
    except Exception as e:
        logger.error(f"Search suggestions failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search suggestions failed"
        )
