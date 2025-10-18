"""
Schema validation utilities to ensure consistency between database and Pydantic models
"""

from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ValidationError
import logging

logger = logging.getLogger(__name__)


class DatabaseSchemaValidator:
    """Validates that data matches the expected database schema"""
    
    # Expected database schema for images table
    IMAGES_SCHEMA = {
        'id': UUID,
        'user_id': UUID,
        'filename': str,
        'original_filename': str,
        'file_size': int,
        'mime_type': str,
        'width': int,
        'height': int,
        'uploaded_at': datetime,
        'updated_at': datetime,
        'processing_status': str,
        'ai_tags': Optional[List[str]],
        'ai_description': Optional[str],
        'dominant_colors': Optional[List[str]],
        'thumbnail_url': Optional[str],
        'original_url': str,
    }
    
    @classmethod
    def validate_image_data(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate image data against database schema
        
        Args:
            data: Dictionary containing image data
            
        Returns:
            Validated data dictionary
            
        Raises:
            ValidationError: If data doesn't match schema
        """
        validated_data = {}
        
        for field, expected_type in cls.IMAGES_SCHEMA.items():
            if field in data:
                value = data[field]
                
                # Handle optional fields
                if expected_type is Optional[List[str]] and value is None:
                    validated_data[field] = None
                elif expected_type is Optional[str] and value is None:
                    validated_data[field] = None
                else:
                    # Type validation
                    if not isinstance(value, expected_type):
                        try:
                            # Try to convert to expected type
                            if expected_type == UUID:
                                validated_data[field] = UUID(str(value))
                            elif expected_type == datetime:
                                if isinstance(value, str):
                                    validated_data[field] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                                else:
                                    validated_data[field] = value
                            else:
                                validated_data[field] = expected_type(value)
                        except (ValueError, TypeError) as e:
                            raise ValidationError(f"Invalid type for field '{field}': {e}")
                    else:
                        validated_data[field] = value
            else:
                # Field is missing
                if expected_type in (Optional[List[str]], Optional[str]):
                    validated_data[field] = None
                else:
                    raise ValidationError(f"Required field '{field}' is missing")
        
        return validated_data
    
    @classmethod
    def validate_insert_data(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate data for database insertion
        
        Args:
            data: Dictionary containing data to insert
            
        Returns:
            Validated data dictionary
        """
        # For insertions, we don't require id, uploaded_at, updated_at (auto-generated)
        insert_data = data.copy()
        
        # Remove auto-generated fields
        insert_data.pop('id', None)
        insert_data.pop('uploaded_at', None)
        insert_data.pop('updated_at', None)
        
        return cls.validate_image_data(insert_data)
    
    @classmethod
    def validate_update_data(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate data for database update
        
        Args:
            data: Dictionary containing data to update
            
        Returns:
            Validated data dictionary
        """
        # For updates, we don't require most fields (only updating provided fields)
        validated_data = {}
        
        for field, value in data.items():
            if field in cls.IMAGES_SCHEMA:
                expected_type = cls.IMAGES_SCHEMA[field]
                
                # Handle optional fields
                if expected_type is Optional[List[str]] and value is None:
                    validated_data[field] = None
                elif expected_type is Optional[str] and value is None:
                    validated_data[field] = None
                else:
                    # Type validation
                    if not isinstance(value, expected_type):
                        try:
                            # Try to convert to expected type
                            if expected_type == UUID:
                                validated_data[field] = UUID(str(value))
                            elif expected_type == datetime:
                                if isinstance(value, str):
                                    validated_data[field] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                                else:
                                    validated_data[field] = value
                            else:
                                validated_data[field] = expected_type(value)
                        except (ValueError, TypeError) as e:
                            raise ValidationError(f"Invalid type for field '{field}': {e}")
                    else:
                        validated_data[field] = value
            else:
                logger.warning(f"Unknown field '{field}' in update data")
        
        return validated_data


def validate_database_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate response from database query
    
    Args:
        data: Dictionary from database query
        
    Returns:
        Validated data dictionary
    """
    return DatabaseSchemaValidator.validate_image_data(data)


def validate_insert_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate data for database insertion
    
    Args:
        data: Dictionary containing data to insert
        
    Returns:
        Validated data dictionary
    """
    return DatabaseSchemaValidator.validate_insert_data(data)


def validate_update_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate data for database update
    
    Args:
        data: Dictionary containing data to update
        
    Returns:
        Validated data dictionary
    """
    return DatabaseSchemaValidator.validate_update_data(data)
