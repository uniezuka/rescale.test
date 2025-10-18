"""
Health check endpoints
"""

from fastapi import APIRouter, Depends
from app.services.ai_processing import ai_processor
from app.database import test_supabase_connection
from app.services.azure_vision import azure_vision_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Image Gallery API",
        "version": "1.0.0"
    }


@router.get("/detailed")
async def detailed_health_check():
    """Detailed health check with service status"""
    health_status = {
        "status": "healthy",
        "service": "AI Image Gallery API",
        "version": "1.0.0",
        "checks": {}
    }
    
    # Check Supabase connection
    try:
        supabase_healthy = await test_supabase_connection()
        health_status["checks"]["supabase"] = {
            "status": "healthy" if supabase_healthy else "unhealthy",
            "message": "Connected" if supabase_healthy else "Connection failed"
        }
    except Exception as e:
        health_status["checks"]["supabase"] = {
            "status": "unhealthy",
            "message": f"Error: {str(e)}"
        }
    
    # Check AI processor status
    try:
        processor_status = ai_processor.get_processing_status()
        health_status["checks"]["ai_processor"] = {
            "status": "healthy",
            "message": f"AI processor active with {processor_status['active_tasks']} tasks",
            "active_tasks": processor_status["active_tasks"],
            "max_concurrent": processor_status["max_concurrent"]
        }
    except Exception as e:
        health_status["checks"]["ai_processor"] = {
            "status": "unhealthy",
            "message": f"Error: {str(e)}"
        }
    
    # Check Azure Vision connection
    try:
        azure_healthy = await azure_vision_service.test_connection()
        health_status["checks"]["azure_vision"] = {
            "status": "healthy" if azure_healthy else "unhealthy",
            "message": "Connected" if azure_healthy else "Connection failed"
        }
    except Exception as e:
        health_status["checks"]["azure_vision"] = {
            "status": "unhealthy",
            "message": f"Error: {str(e)}"
        }
    
    # Determine overall status
    all_healthy = all(
        check["status"] == "healthy" 
        for check in health_status["checks"].values()
    )
    
    health_status["status"] = "healthy" if all_healthy else "degraded"
    
    return health_status


@router.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes"""
    try:
        # Check critical dependencies
        supabase_ready = await test_supabase_connection()
        
        if not supabase_ready:
            return {"status": "not_ready", "reason": "Supabase connection failed"}
        
        return {"status": "ready"}
        
    except Exception as e:
        return {"status": "not_ready", "reason": str(e)}


@router.get("/live")
async def liveness_check():
    """Liveness check for Kubernetes"""
    return {"status": "alive"}
