"""
Database configuration and Supabase client setup
"""

from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Global Supabase client
_supabase_client: Client = None


def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    global _supabase_client
    if _supabase_client is None:
        raise RuntimeError("Supabase client not initialized. Call init_supabase() first.")
    return _supabase_client


def init_supabase():
    """Initialize Supabase client"""
    global _supabase_client
    try:
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        raise


def get_supabase_anon_client() -> Client:
    """Get Supabase anonymous client for public operations"""
    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key
    )


async def test_supabase_connection():
    """Test Supabase connection"""
    try:
        client = get_supabase_client()
        # Simple query to test connection
        result = client.table('images').select('id').limit(1).execute()
        return True
    except Exception as e:
        logger.error(f"Supabase connection test failed: {e}")
        return False
