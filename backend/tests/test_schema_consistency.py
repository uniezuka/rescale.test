"""
Test schema consistency between database and Pydantic models
"""

import pytest
from uuid import UUID, uuid4
from datetime import datetime
from app.models.image import ImageResponse, ImageCreate, ImageUpdate, ProcessingStatus
from app.utils.schema_validation import validate_database_response, validate_insert_request, validate_update_request


class TestSchemaConsistency:
    """Test that Pydantic models match database schema"""
    
    def test_image_response_schema(self):
        """Test ImageResponse matches database schema"""
        # Sample data that would come from database
        db_data = {
            'id': str(uuid4()),
            'user_id': str(uuid4()),
            'filename': 'test_image.jpg',
            'original_filename': 'original_test.jpg',
            'file_size': 1024000,
            'mime_type': 'image/jpeg',
            'width': 1920,
            'height': 1080,
            'uploaded_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'processing_status': 'completed',
            'ai_tags': ['nature', 'landscape'],
            'ai_description': 'A beautiful landscape',
            'dominant_colors': ['#FF0000', '#00FF00'],
            'thumbnail_url': 'https://example.com/thumb.jpg',
            'original_url': 'https://example.com/original.jpg'
        }
        
        # Validate database response
        validated_data = validate_database_response(db_data)
        
        # Create Pydantic model
        image_response = ImageResponse(**validated_data)
        
        # Verify all fields are present and correctly typed
        assert isinstance(image_response.id, UUID)
        assert isinstance(image_response.user_id, UUID)
        assert isinstance(image_response.filename, str)
        assert isinstance(image_response.original_filename, str)
        assert isinstance(image_response.file_size, int)
        assert isinstance(image_response.mime_type, str)
        assert isinstance(image_response.width, int)
        assert isinstance(image_response.height, int)
        assert isinstance(image_response.uploaded_at, datetime)
        assert isinstance(image_response.updated_at, datetime)
        assert isinstance(image_response.processing_status, ProcessingStatus)
        assert isinstance(image_response.ai_tags, list)
        assert isinstance(image_response.ai_description, str)
        assert isinstance(image_response.dominant_colors, list)
        assert isinstance(image_response.thumbnail_url, str)
        assert isinstance(image_response.original_url, str)
    
    def test_image_create_schema(self):
        """Test ImageCreate matches database insert requirements"""
        create_data = {
            'filename': 'test_image.jpg',
            'original_filename': 'original_test.jpg',
            'file_size': 1024000,
            'mime_type': 'image/jpeg',
            'width': 1920,
            'height': 1080,
            'original_url': 'https://example.com/original.jpg',
            'thumbnail_url': 'https://example.com/thumb.jpg'
        }
        
        # Validate insert request
        validated_data = validate_insert_request(create_data)
        
        # Create Pydantic model
        image_create = ImageCreate(**validated_data)
        
        # Verify all fields are present and correctly typed
        assert isinstance(image_create.filename, str)
        assert isinstance(image_create.original_filename, str)
        assert isinstance(image_create.file_size, int)
        assert isinstance(image_create.mime_type, str)
        assert isinstance(image_create.width, int)
        assert isinstance(image_create.height, int)
        assert isinstance(image_create.original_url, str)
        assert isinstance(image_create.thumbnail_url, str)
    
    def test_image_update_schema(self):
        """Test ImageUpdate matches database update requirements"""
        update_data = {
            'ai_tags': ['nature', 'landscape'],
            'ai_description': 'A beautiful landscape',
            'processing_status': 'completed'
        }
        
        # Validate update request
        validated_data = validate_update_request(update_data)
        
        # Create Pydantic model
        image_update = ImageUpdate(**validated_data)
        
        # Verify all fields are present and correctly typed
        assert isinstance(image_update.ai_tags, list)
        assert isinstance(image_update.ai_description, str)
        assert isinstance(image_update.processing_status, ProcessingStatus)
    
    def test_validation_errors(self):
        """Test that validation catches type mismatches"""
        # Test invalid UUID
        with pytest.raises(Exception):
            validate_database_response({'id': 'not-a-uuid'})
        
        # Test invalid file size
        with pytest.raises(Exception):
            ImageCreate(
                filename='test.jpg',
                original_filename='test.jpg',
                file_size=-1,  # Invalid negative size
                mime_type='image/jpeg',
                width=100,
                height=100,
                original_url='https://example.com/test.jpg'
            )
        
        # Test invalid MIME type
        with pytest.raises(Exception):
            ImageCreate(
                filename='test.jpg',
                original_filename='test.jpg',
                file_size=1000,
                mime_type='text/plain',  # Invalid MIME type
                width=100,
                height=100,
                original_url='https://example.com/test.jpg'
            )
    
    def test_optional_fields(self):
        """Test that optional fields work correctly"""
        # Test with None values for optional fields
        db_data = {
            'id': str(uuid4()),
            'user_id': str(uuid4()),
            'filename': 'test_image.jpg',
            'original_filename': 'original_test.jpg',
            'file_size': 1024000,
            'mime_type': 'image/jpeg',
            'width': 1920,
            'height': 1080,
            'uploaded_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'processing_status': 'pending',
            'ai_tags': None,
            'ai_description': None,
            'dominant_colors': None,
            'thumbnail_url': None,
            'original_url': 'https://example.com/original.jpg'
        }
        
        # Should not raise validation error
        validated_data = validate_database_response(db_data)
        image_response = ImageResponse(**validated_data)
        
        assert image_response.ai_tags is None
        assert image_response.ai_description is None
        assert image_response.dominant_colors is None
        assert image_response.thumbnail_url is None


if __name__ == "__main__":
    pytest.main([__file__])
