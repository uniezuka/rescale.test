"""
Image processing service for thumbnails and optimization
"""

import io
from PIL import Image
import logging
from typing import Tuple, Optional

logger = logging.getLogger(__name__)


class ImageProcessingService:
    """Service for client-side image processing"""
    
    def __init__(self):
        self.thumbnail_size = (300, 300)
        self.max_quality = 85
        self.min_quality = 60
    
    def create_thumbnail(self, image_data: bytes, format: str = "JPEG") -> bytes:
        """
        Create thumbnail from image data
        
        Args:
            image_data: Binary image data
            format: Output format (JPEG, PNG, WEBP)
            
        Returns:
            Binary thumbnail data
        """
        try:
            # Open image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary (for JPEG)
            if format.upper() == "JPEG" and image.mode in ("RGBA", "LA", "P"):
                # Create white background for transparent images
                background = Image.new("RGB", image.size, (255, 255, 255))
                if image.mode == "P":
                    image = image.convert("RGBA")
                background.paste(image, mask=image.split()[-1] if image.mode == "RGBA" else None)
                image = background
            elif format.upper() != "JPEG":
                image = image.convert("RGB")
            
            # Create thumbnail
            image.thumbnail(self.thumbnail_size, Image.Resampling.LANCZOS)
            
            # Save to bytes
            output = io.BytesIO()
            image.save(
                output,
                format=format,
                quality=self.max_quality,
                optimize=True
            )
            
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Thumbnail creation failed: {e}")
            raise Exception(f"Thumbnail creation failed: {e}")
    
    def optimize_image(self, image_data: bytes, max_size: int = 1920) -> bytes:
        """
        Optimize image for web display
        
        Args:
            image_data: Binary image data
            max_size: Maximum dimension size
            
        Returns:
            Optimized binary image data
        """
        try:
            # Open image
            image = Image.open(io.BytesIO(image_data))
            original_format = image.format
            
            # Convert to RGB if necessary
            if image.mode in ("RGBA", "LA", "P"):
                if original_format == "JPEG":
                    background = Image.new("RGB", image.size, (255, 255, 255))
                    if image.mode == "P":
                        image = image.convert("RGBA")
                    background.paste(image, mask=image.split()[-1] if image.mode == "RGBA" else None)
                    image = background
                else:
                    image = image.convert("RGB")
            
            # Resize if necessary
            if max(image.size) > max_size:
                ratio = max_size / max(image.size)
                new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            
            # Save optimized image
            output = io.BytesIO()
            save_format = original_format or "JPEG"
            image.save(
                output,
                format=save_format,
                quality=self.max_quality,
                optimize=True
            )
            
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Image optimization failed: {e}")
            raise Exception(f"Image optimization failed: {e}")
    
    def get_image_dimensions(self, image_data: bytes) -> Tuple[int, int]:
        """
        Get image dimensions
        
        Args:
            image_data: Binary image data
            
        Returns:
            Tuple of (width, height)
        """
        try:
            image = Image.open(io.BytesIO(image_data))
            return image.size[0], image.size[1]
        except Exception as e:
            logger.error(f"Failed to get image dimensions: {e}")
            raise Exception(f"Failed to get image dimensions: {e}")
    
    def get_image_info(self, image_data: bytes) -> dict:
        """
        Get image information
        
        Args:
            image_data: Binary image data
            
        Returns:
            Dictionary with image information
        """
        try:
            image = Image.open(io.BytesIO(image_data))
            
            return {
                "width": image.size[0],
                "height": image.size[1],
                "format": image.format,
                "mode": image.mode,
                "size_bytes": len(image_data)
            }
            
        except Exception as e:
            logger.error(f"Failed to get image info: {e}")
            raise Exception(f"Failed to get image info: {e}")
    
    def validate_image(self, image_data: bytes) -> Tuple[bool, Optional[str]]:
        """
        Validate image data
        
        Args:
            image_data: Binary image data
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Check file size
            if len(image_data) > settings.max_file_size:
                return False, f"File size exceeds maximum allowed size of {settings.max_file_size} bytes"
            
            # Try to open image
            image = Image.open(io.BytesIO(image_data))
            
            # Check format
            if image.format not in ["JPEG", "PNG", "WEBP", "GIF"]:
                return False, f"Unsupported image format: {image.format}"
            
            # Check dimensions
            if image.size[0] < 10 or image.size[1] < 10:
                return False, "Image dimensions too small"
            
            if image.size[0] > 10000 or image.size[1] > 10000:
                return False, "Image dimensions too large"
            
            return True, None
            
        except Exception as e:
            return False, f"Invalid image data: {e}"


# Global service instance
image_processing_service = ImageProcessingService()
