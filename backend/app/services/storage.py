"""
Supabase Storage service for file management
"""

import logging
from typing import Optional, Tuple
from supabase import Client
from app.database import get_supabase_client
from app.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """Service for Supabase Storage operations"""
    
    def __init__(self):
        self._supabase = None
        self.images_bucket = "images"
        self.thumbnails_bucket = "thumbnails"
    
    @property
    def supabase(self) -> Client:
        """Lazy initialization of Supabase client"""
        if self._supabase is None:
            self._supabase = get_supabase_client()
        return self._supabase
    
    async def upload_image(self, file_data: bytes, filename: str, user_id: str) -> Tuple[str, str]:
        """
        Upload image to Supabase Storage
        
        Args:
            file_data: Binary image data
            filename: Original filename
            user_id: User ID for path organization
            
        Returns:
            Tuple of (storage_path, public_url)
        """
        try:
            # Create user-specific path
            storage_path = f"{user_id}/{filename}"
            
            # Upload to images bucket
            result = self.supabase.storage.from_(self.images_bucket).upload(
                path=storage_path,
                file=file_data,
                file_options={"content-type": "image/jpeg"}
            )
            
            if result.get("error"):
                raise Exception(f"Storage upload error: {result['error']}")
            
            # Get public URL
            public_url = self.supabase.storage.from_(self.images_bucket).get_public_url(storage_path)
            
            logger.info(f"Image uploaded successfully: {storage_path}")
            return storage_path, public_url
            
        except Exception as e:
            logger.error(f"Image upload failed: {e}")
            raise Exception(f"Image upload failed: {e}")
    
    async def upload_thumbnail(self, thumbnail_data: bytes, filename: str, user_id: str) -> Tuple[str, str]:
        """
        Upload thumbnail to Supabase Storage
        
        Args:
            thumbnail_data: Binary thumbnail data
            filename: Original filename
            user_id: User ID for path organization
            
        Returns:
            Tuple of (thumbnail_path, public_url)
        """
        try:
            # Create thumbnail filename
            name, ext = filename.rsplit('.', 1)
            thumbnail_filename = f"{name}_thumb.{ext}"
            thumbnail_path = f"{user_id}/{thumbnail_filename}"
            
            # Upload to thumbnails bucket
            result = self.supabase.storage.from_(self.thumbnails_bucket).upload(
                path=thumbnail_path,
                file=thumbnail_data,
                file_options={"content-type": "image/jpeg"}
            )
            
            if result.get("error"):
                raise Exception(f"Thumbnail upload error: {result['error']}")
            
            # Get public URL
            public_url = self.supabase.storage.from_(self.thumbnails_bucket).get_public_url(thumbnail_path)
            
            logger.info(f"Thumbnail uploaded successfully: {thumbnail_path}")
            return thumbnail_path, public_url
            
        except Exception as e:
            logger.error(f"Thumbnail upload failed: {e}")
            raise Exception(f"Thumbnail upload failed: {e}")
    
    async def delete_image(self, storage_path: str) -> bool:
        """
        Delete image from storage
        
        Args:
            storage_path: Path to the image in storage
            
        Returns:
            True if deletion was successful
        """
        try:
            result = self.supabase.storage.from_(self.images_bucket).remove([storage_path])
            
            if result.get("error"):
                logger.error(f"Image deletion error: {result['error']}")
                return False
            
            logger.info(f"Image deleted successfully: {storage_path}")
            return True
            
        except Exception as e:
            logger.error(f"Image deletion failed: {e}")
            return False
    
    async def delete_thumbnail(self, thumbnail_path: str) -> bool:
        """
        Delete thumbnail from storage
        
        Args:
            thumbnail_path: Path to the thumbnail in storage
            
        Returns:
            True if deletion was successful
        """
        try:
            result = self.supabase.storage.from_(self.thumbnails_bucket).remove([thumbnail_path])
            
            if result.get("error"):
                logger.error(f"Thumbnail deletion error: {result['error']}")
                return False
            
            logger.info(f"Thumbnail deleted successfully: {thumbnail_path}")
            return True
            
        except Exception as e:
            logger.error(f"Thumbnail deletion failed: {e}")
            return False
    
    async def get_public_url(self, storage_path: str, bucket: str = "images") -> str:
        """
        Get public URL for a file in storage
        
        Args:
            storage_path: Path to the file in storage
            bucket: Storage bucket name
            
        Returns:
            Public URL
        """
        try:
            return self.supabase.storage.from_(bucket).get_public_url(storage_path)
        except Exception as e:
            logger.error(f"Failed to get public URL: {e}")
            raise Exception(f"Failed to get public URL: {e}")
    
    async def file_exists(self, storage_path: str, bucket: str = "images") -> bool:
        """
        Check if file exists in storage
        
        Args:
            storage_path: Path to the file in storage
            bucket: Storage bucket name
            
        Returns:
            True if file exists
        """
        try:
            result = self.supabase.storage.from_(bucket).list(
                path=storage_path.rsplit('/', 1)[0] if '/' in storage_path else ""
            )
            
            if result.get("error"):
                return False
            
            filename = storage_path.rsplit('/', 1)[-1]
            return any(item.get("name") == filename for item in result)
            
        except Exception as e:
            logger.error(f"Failed to check file existence: {e}")
            return False


# Global service instance
storage_service = StorageService()
