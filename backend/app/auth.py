"""
Authentication utilities for Supabase integration
"""

import logging
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from app.database import get_supabase_client, get_supabase_anon_client
from app.models.user import UserResponse

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserResponse:
    """
    Get current authenticated user from JWT token
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        UserResponse with user information
        
    Raises:
        HTTPException: If authentication fails
    """
    try:
        supabase = get_supabase_anon_client()
        
        # Set the session with the provided token
        supabase.auth.set_session(credentials.credentials, "")
        
        # Get user from token
        response = supabase.auth.get_user(credentials.credentials)
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = response.user
        
        # Create user response
        return UserResponse(
            id=user.id,
            email=user.email,
            created_at=user.created_at,
            last_sign_in=user.last_sign_in_at
        )
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[UserResponse]:
    """
    Get current user if authenticated, otherwise return None
    
    Args:
        credentials: Optional HTTP Bearer token credentials
        
    Returns:
        UserResponse if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def verify_user_owns_image(user_id: str, image_user_id: str) -> bool:
    """
    Verify that a user owns an image
    
    Args:
        user_id: ID of the authenticated user
        image_user_id: ID of the user who owns the image
        
    Returns:
        True if user owns the image
    """
    return user_id == image_user_id


async def require_image_ownership(user_id: str, image_user_id: str):
    """
    Require that the authenticated user owns the image
    
    Args:
        user_id: ID of the authenticated user
        image_user_id: ID of the user who owns the image
        
    Raises:
        HTTPException: If user doesn't own the image
    """
    if not verify_user_owns_image(user_id, image_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this image"
        )


async def get_user_from_token(token: str) -> Optional[UserResponse]:
    """
    Get user information from a JWT token
    
    Args:
        token: JWT token
        
    Returns:
        UserResponse if token is valid, None otherwise
    """
    try:
        supabase = get_supabase_anon_client()
        supabase.auth.set_session(token, "")
        
        response = supabase.auth.get_user(token)
        
        if not response.user:
            return None
        
        user = response.user
        
        return UserResponse(
            id=user.id,
            email=user.email,
            created_at=user.created_at,
            last_sign_in=user.last_sign_in_at
        )
        
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        return None


def create_auth_exception(detail: str = "Authentication required") -> HTTPException:
    """
    Create a standardized authentication exception
    
    Args:
        detail: Error detail message
        
    Returns:
        HTTPException for authentication errors
    """
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def create_forbidden_exception(detail: str = "Access forbidden") -> HTTPException:
    """
    Create a standardized forbidden exception
    
    Args:
        detail: Error detail message
        
    Returns:
        HTTPException for forbidden errors
    """
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=detail,
    )
