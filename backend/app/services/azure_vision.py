"""
Azure Computer Vision service for image analysis
"""

import httpx
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from app.config import settings
from app.models.image import AIProcessingResult

logger = logging.getLogger(__name__)


class AzureVisionService:
    """Service for Azure Computer Vision API integration"""
    
    def __init__(self):
        self.endpoint = settings.azure_vision_endpoint
        self.api_key = settings.azure_vision_key
        self.base_url = f"{self.endpoint}/vision/v3.2"
        
        # Rate limiting configuration
        # Azure Computer Vision Free Tier: 5,000 predictions per month, 20 per minute
        self.MAX_REQUESTS_PER_MONTH = 4000  # 80% of free tier limit
        self.MAX_REQUESTS_PER_DAY = 150     # ~5,000/30 days with buffer
        self.MAX_REQUESTS_PER_MINUTE = 20   # Azure free tier minute limit
        
        # Usage tracking
        self.request_times = []
        self.monthly_usage = 0
        self.daily_usage = 0
        
    async def _check_rate_limit(self) -> None:
        """Check and enforce rate limits to stay within free tier"""
        now = datetime.now()
        
        # Clean old request times
        self.request_times = [
            req_time for req_time in self.request_times 
            if now - req_time < timedelta(hours=1)
        ]
        
        # Check monthly limit (most restrictive)
        if self.monthly_usage >= self.MAX_REQUESTS_PER_MONTH:
            raise Exception(f"Monthly free tier limit reached ({self.MAX_REQUESTS_PER_MONTH} requests). Please wait until next month or upgrade to a paid plan.")
        
        # Check daily limit
        if self.daily_usage >= self.MAX_REQUESTS_PER_DAY:
            raise Exception(f"Daily limit reached ({self.MAX_REQUESTS_PER_DAY} requests). Please try again tomorrow.")
        
        # Check minute limit
        minute_requests = len([t for t in self.request_times if now - t < timedelta(minutes=1)])
        if minute_requests >= self.MAX_REQUESTS_PER_MINUTE:
            # Wait until oldest request is more than a minute old
            oldest_request = min(self.request_times)
            wait_time = (oldest_request + timedelta(minutes=1) - now).total_seconds()
            if wait_time > 0:
                await asyncio.sleep(wait_time)
        
        # Record this request
        self.request_times.append(now)
        self.monthly_usage += 1
        self.daily_usage += 1
        
    async def analyze_image(self, image_url: str) -> AIProcessingResult:
        """
        Analyze image using Azure Computer Vision API
        
        Args:
            image_url: URL of the image to analyze
            
        Returns:
            AIProcessingResult with analysis data
            
        Raises:
            HTTPException: If API call fails
        """
        # Check rate limits before making API call
        await self._check_rate_limit()
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/analyze",
                    headers={
                        "Ocp-Apim-Subscription-Key": self.api_key,
                        "Content-Type": "application/json"
                    },
                    json={"url": image_url},
                    params={
                        "visualFeatures": "Tags,Description,Color",
                        "details": "Landmarks",
                        "language": "en"
                    }
                )
                
                response.raise_for_status()
                data = response.json()
                
                return self._process_azure_response(data)
                
        except httpx.HTTPError as e:
            logger.error(f"Azure Vision API error: {e}")
            raise Exception(f"Azure Vision API error: {e}")
        except Exception as e:
            logger.error(f"Image analysis error: {e}")
            raise Exception(f"Image analysis failed: {e}")
    
    async def analyze_image_blob(self, image_data: bytes, content_type: str) -> AIProcessingResult:
        """
        Analyze image from binary data using Azure Computer Vision API
        
        Args:
            image_data: Binary image data
            content_type: MIME type of the image
            
        Returns:
            AIProcessingResult with analysis data
        """
        # Check rate limits before making API call
        await self._check_rate_limit()
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/analyze",
                    headers={
                        "Ocp-Apim-Subscription-Key": self.api_key,
                        "Content-Type": content_type
                    },
                    content=image_data,
                    params={
                        "visualFeatures": "Tags,Description,Color",
                        "details": "Landmarks",
                        "language": "en"
                    }
                )
                
                response.raise_for_status()
                data = response.json()
                
                return self._process_azure_response(data)
                
        except httpx.HTTPError as e:
            logger.error(f"Azure Vision API error: {e}")
            raise Exception(f"Azure Vision API error: {e}")
        except Exception as e:
            logger.error(f"Image analysis error: {e}")
            raise Exception(f"Image analysis failed: {e}")
    
    def _process_azure_response(self, data: Dict[str, Any]) -> AIProcessingResult:
        """
        Process Azure Computer Vision API response
        
        Args:
            data: Raw response from Azure API
            
        Returns:
            Processed AIProcessingResult
        """
        # Extract tags
        tags = []
        if "tags" in data:
            tags = [
                tag["name"] 
                for tag in data["tags"] 
                if tag.get("confidence", 0) > 0.5
            ][:10]  # Limit to top 10 tags
        
        # Extract description
        description = ""
        if "description" in data and "captions" in data["description"]:
            captions = data["description"]["captions"]
            if captions:
                description = captions[0]["text"]
        
        # Extract dominant colors
        dominant_colors = []
        if "color" in data and "dominantColors" in data["color"]:
            dominant_colors = data["color"]["dominantColors"][:5]  # Limit to 5 colors
        
        # Extract confidence scores
        confidence_scores = {}
        if "tags" in data:
            for tag in data["tags"]:
                confidence_scores[tag["name"]] = tag.get("confidence", 0)
        
        return AIProcessingResult(
            tags=self._clean_tags(tags),
            description=self._clean_description(description),
            dominant_colors=self._format_colors(dominant_colors),
            confidence_scores=confidence_scores,
            processing_time=0.0  # Will be set by the caller
        )
    
    def _clean_tags(self, tags: List[str]) -> List[str]:
        """Clean and filter tags"""
        return [
            tag.lower().strip()
            for tag in tags
            if tag and len(tag) > 2 and len(tag) < 50
        ][:8]  # Limit to 8 tags
    
    def _clean_description(self, description: str) -> str:
        """Clean description text"""
        if not description:
            return ""
        
        return description.strip().replace("\n", " ")[:200]  # Limit length
    
    def _format_colors(self, colors: List[str]) -> List[str]:
        """Format color codes"""
        formatted_colors = []
        for color in colors:
            if color and len(color) == 6:
                formatted_colors.append(f"#{color.upper()}")
            elif color and color.startswith("#"):
                formatted_colors.append(color.upper())
        
        return formatted_colors[:5]  # Limit to 5 colors
    
    async def test_connection(self) -> bool:
        """
        Test connection to Azure Computer Vision API
        
        Returns:
            True if connection is successful
        """
        try:
            # Use a simple test image
            test_url = "https://via.placeholder.com/150x150.png"
            await self.analyze_image(test_url)
            return True
        except Exception as e:
            logger.error(f"Azure connection test failed: {e}")
            return False


# Global service instance
azure_vision_service = AzureVisionService()
