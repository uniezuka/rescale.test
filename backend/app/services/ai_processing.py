"""
Simple AI processing service without Celery
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID
from app.services.azure_vision import azure_vision_service
from app.database import get_supabase_client
from app.models.image import ProcessingStatus

logger = logging.getLogger(__name__)


class SimpleAIProcessor:
    """Simple AI processor that handles image analysis in the background"""
    
    def __init__(self):
        self.processing_tasks = {}  # Track active processing tasks
        self.max_concurrent = 5
    
    async def process_image(self, image_id: UUID, image_url: str) -> Dict[str, Any]:
        """
        Process image with AI analysis
        
        Args:
            image_id: ID of the image to process
            image_url: URL of the image to analyze
            
        Returns:
            Dictionary with processing results
        """
        start_time = datetime.now()
        
        try:
            logger.info(f"Starting AI processing for image {image_id}")
            
            # Check if we're already processing this image
            if image_id in self.processing_tasks:
                return {"success": False, "error": "Image is already being processed"}
            
            # Check concurrent processing limit
            if len(self.processing_tasks) >= self.max_concurrent:
                return {"success": False, "error": "Too many concurrent processing tasks"}
            
            # Add to processing tasks
            self.processing_tasks[image_id] = {
                "started_at": start_time,
                "status": "processing"
            }
            
            # Update database status
            supabase = get_supabase_client()
            await self._update_image_status(image_id, ProcessingStatus.PROCESSING)
            
            # Analyze image with Azure Computer Vision
            logger.info(f"Analyzing image {image_id} with Azure Computer Vision")
            ai_result = await azure_vision_service.analyze_image(image_url)
            
            # Update database with results
            logger.info(f"Updating database with AI results for image {image_id}")
            await self._update_image_with_results(image_id, ai_result)
            
            # Remove from processing tasks
            if image_id in self.processing_tasks:
                del self.processing_tasks[image_id]
            
            processing_time = (datetime.now() - start_time).total_seconds()
            logger.info(f"AI processing completed for image {image_id} in {processing_time:.2f}s")
            
            return {
                "success": True,
                "image_id": image_id,
                "processing_time": processing_time,
                "result": {
                    "tags": ai_result.tags,
                    "description": ai_result.description,
                    "dominant_colors": ai_result.dominant_colors,
                    "confidence_scores": ai_result.confidence_scores
                }
            }
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"AI processing failed for image {image_id}: {error_message}")
            
            # Remove from processing tasks
            if image_id in self.processing_tasks:
                del self.processing_tasks[image_id]
            
            # Update database with error
            await self._update_image_with_error(image_id, error_message)
            
            return {
                "success": False,
                "image_id": image_id,
                "error": error_message,
                "processing_time": (datetime.now() - start_time).total_seconds()
            }
    
    async def process_image_background(self, image_id: UUID, image_url: str) -> None:
        """
        Process image in background (fire and forget)
        
        Args:
            image_id: ID of the image to process
            image_url: URL of the image to analyze
        """
        # Run processing in background
        asyncio.create_task(self.process_image(image_id, image_url))
    
    async def _update_image_status(self, image_id: UUID, status: ProcessingStatus) -> None:
        """Update image processing status"""
        try:
            supabase = get_supabase_client()
            supabase.table('images').update({
                'processing_status': status.value,
                'updated_at': datetime.now().isoformat()
            }).eq('id', image_id).execute()
        except Exception as e:
            logger.error(f"Failed to update image status: {e}")
    
    async def _update_image_with_results(self, image_id: UUID, ai_result) -> None:
        """Update image with AI analysis results"""
        try:
            supabase = get_supabase_client()
            supabase.table('images').update({
                'processing_status': ProcessingStatus.COMPLETED.value,
                'ai_tags': ai_result.tags,
                'ai_description': ai_result.description,
                'dominant_colors': ai_result.dominant_colors,
                'updated_at': datetime.now().isoformat()
            }).eq('id', image_id).execute()
        except Exception as e:
            logger.error(f"Failed to update image with AI results: {e}")
    
    async def _update_image_with_error(self, image_id: UUID, error_message: str) -> None:
        """Update image with processing error"""
        try:
            supabase = get_supabase_client()
            supabase.table('images').update({
                'processing_status': ProcessingStatus.FAILED.value,
                'updated_at': datetime.now().isoformat()
            }).eq('id', image_id).execute()
            # Log the error message since we can't store it in the database
            logger.error(f"AI processing failed for image {image_id}: {error_message}")
        except Exception as e:
            logger.error(f"Failed to update image with error: {e}")
    
    def get_processing_status(self) -> Dict[str, Any]:
        """Get current processing status"""
        return {
            "active_tasks": len(self.processing_tasks),
            "max_concurrent": self.max_concurrent,
            "processing_images": list(self.processing_tasks.keys())
        }
    
    async def retry_failed_processing(self, image_id: UUID, image_url: str) -> Dict[str, Any]:
        """Retry processing for a failed image"""
        logger.info(f"Retrying AI processing for image {image_id}")
        
        # Reset status to pending first
        await self._update_image_status(image_id, ProcessingStatus.PENDING)
        
        # Process the image
        return await self.process_image(image_id, image_url)


# Global processor instance
ai_processor = SimpleAIProcessor()
