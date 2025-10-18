"""
Image management API endpoints
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse
import io
import os
from uuid import UUID

from app.auth import get_current_user, require_image_ownership
from app.models.image import (
    ImageResponse, ImageListResponse, ImageUploadResponse, 
    ImageDeleteResponse, ProcessingStatus
)
from app.models.user import UserResponse
from app.services.storage import storage_service
from app.services.image_processing import image_processing_service
from app.services.ai_processing import ai_processor
from app.database import get_supabase_client
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/images", tags=["images"])


@router.post("/upload", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload a single image file
    
    Args:
        file: Image file to upload
        current_user: Authenticated user
        
    Returns:
        ImageUploadResponse with upload results
    """
    try:
        # Validate file type
        if file.content_type not in settings.allowed_file_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file.content_type} not allowed. Allowed types: {', '.join(settings.allowed_file_types)}"
            )
        
        # Read file data
        file_data = await file.read()
        
        # Validate image
        is_valid, error_message = image_processing_service.validate_image(file_data)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        # Upload to storage
        storage_path, public_url = await storage_service.upload_image(
            file_data, file.filename, current_user.id
        )
        
        # Create thumbnail
        thumbnail_data = image_processing_service.create_thumbnail(file_data)
        thumbnail_path, thumbnail_url = await storage_service.upload_thumbnail(
            thumbnail_data, file.filename, current_user.id
        )
        
        # Get image dimensions
        width, height = image_processing_service.get_image_dimensions(file_data)
        
        # Save to database
        supabase = get_supabase_client()
        result = supabase.table('images').insert({
            'user_id': current_user.id,
            'filename': storage_path,  # Use storage path as filename
            'original_filename': file.filename,
            'file_size': len(file_data),
            'mime_type': file.content_type,
            'width': width,
            'height': height,
            'original_url': public_url,
            'thumbnail_url': thumbnail_url,
            'processing_status': ProcessingStatus.PENDING
        }).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save image record to database"
            )
        
        image_id = result.data[0]['id']
        
        # Start AI processing in background
        try:
            await ai_processor.process_image_background(image_id, public_url)
            processing_started = True
            
        except Exception as e:
            logger.error(f"Failed to start AI processing: {e}")
            processing_started = False
        
        return ImageUploadResponse(
            success=True,
            image_id=image_id,
            message="Image uploaded successfully",
            processing_started=processing_started
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {str(e)}"
        )


@router.get("/", response_model=ImageListResponse)
async def get_images(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get user's images with pagination
    
    Args:
        page: Page number
        limit: Items per page
        current_user: Authenticated user
        
    Returns:
        ImageListResponse with paginated images
    """
    try:
        supabase = get_supabase_client()
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get images
        result = supabase.table('images').select(
            '*', count='exact'
        ).eq(
            'user_id', current_user.id
        ).order(
            'created_at', desc=True
        ).range(offset, offset + limit - 1).execute()
        
        if not result.data:
            return ImageListResponse(
                images=[],
                total=0,
                page=page,
                limit=limit,
                has_next=False,
                has_prev=False
            )
        
        # Convert to response models
        images = [ImageResponse(**image) for image in result.data]
        
        total = result.count or 0
        has_next = offset + limit < total
        has_prev = page > 1
        
        return ImageListResponse(
            images=images,
            total=total,
            page=page,
            limit=limit,
            has_next=has_next,
            has_prev=has_prev
        )
        
    except Exception as e:
        logger.error(f"Failed to get images: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve images"
        )


@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: UUID,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get specific image by ID
    
    Args:
        image_id: ID of the image
        current_user: Authenticated user
        
    Returns:
        ImageResponse with image details
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table('images').select('*').eq('id', image_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )
        
        # Check ownership
        await require_image_ownership(current_user.id, result.data['user_id'])
        
        return ImageResponse(**result.data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get image {image_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve image"
        )


@router.delete("/{image_id}", response_model=ImageDeleteResponse)
async def delete_image(
    image_id: UUID,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete an image
    
    Args:
        image_id: ID of the image to delete
        current_user: Authenticated user
        
    Returns:
        ImageDeleteResponse with deletion results
    """
    try:
        supabase = get_supabase_client()
        
        # Get image details
        result = supabase.table('images').select('*').eq('id', image_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )
        
        image_data = result.data
        
        # Check ownership
        await require_image_ownership(current_user.id, image_data['user_id'])
        
        deleted_files = []
        
        # Delete from storage
        filename = image_data.get('filename')
        if filename:
            if await storage_service.delete_image(filename):
                deleted_files.append(filename)
        
        # Delete thumbnail (construct path from filename)
        if filename:
            # Extract file extension and create thumbnail filename
            name, ext = os.path.splitext(filename)
            thumbnail_filename = f"{name}_thumb.jpg"
            if await storage_service.delete_thumbnail(thumbnail_filename):
                deleted_files.append(thumbnail_filename)
        
        # Delete from database
        supabase.table('images').delete().eq('id', image_id).execute()
        
        return ImageDeleteResponse(
            success=True,
            message="Image deleted successfully",
            deleted_files=deleted_files
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete image {image_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete image"
        )


@router.post("/{image_id}/retry-processing")
async def retry_ai_processing(
    image_id: UUID,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Retry AI processing for an image
    
    Args:
        image_id: ID of the image to retry processing
        current_user: Authenticated user
        
    Returns:
        Success message
    """
    try:
        supabase = get_supabase_client()
        
        # Get image details
        result = supabase.table('images').select('*').eq('id', image_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )
        
        image_data = result.data
        
        # Check ownership
        await require_image_ownership(current_user.id, image_data['user_id'])
        
        # Check if image has a public URL
        if not image_data.get('original_url'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image does not have a public URL for processing"
            )
        
        # Start AI processing
        result = await ai_processor.retry_failed_processing(image_id, image_data['original_url'])
        
        return {
            "success": result["success"],
            "message": "AI processing restarted" if result["success"] else result.get("error", "Failed to restart processing")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retry AI processing for image {image_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to restart AI processing"
        )


@router.get("/{image_id}/download")
async def download_image(
    image_id: UUID,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Download an image file
    
    Args:
        image_id: ID of the image to download
        current_user: Authenticated user
        
    Returns:
        StreamingResponse with image file
    """
    try:
        supabase = get_supabase_client()
        
        # Get image details
        result = supabase.table('images').select('*').eq('id', image_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )
        
        image_data = result.data
        
        # Check ownership
        await require_image_ownership(current_user.id, image_data['user_id'])
        
        # Get file from storage
        filename = image_data['filename']  # Use filename field instead of storage_path
        file_data = supabase.storage.from_('images').download(filename)
        
        if not file_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image file not found in storage"
            )
        
        # Return file as streaming response
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type=image_data['mime_type'],
            headers={
                "Content-Disposition": f"attachment; filename={image_data['original_filename']}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download image {image_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download image"
        )
