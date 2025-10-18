# FastAPI Backend Setup - AI Image Gallery

## 🐍 FastAPI Backend Architecture

The backend uses FastAPI (Python) as recommended in the original requirements, providing a robust and high-performance API for the AI Image Gallery application.

## 🏗️ Backend Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration settings
│   ├── database.py             # Supabase client setup
│   ├── auth.py                 # Authentication utilities
│   ├── models/                 # Pydantic models
│   │   ├── __init__.py
│   │   ├── image.py
│   │   ├── user.py
│   │   └── search.py
│   ├── api/                    # API routes
│   │   ├── __init__.py
│   │   ├── images.py
│   │   ├── search.py
│   │   └── auth.py
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   ├── azure_vision.py
│   │   ├── image_processing.py
│   │   └── storage.py
│   ├── tasks/                  # Celery background tasks
│   │   ├── __init__.py
│   │   ├── ai_processing.py
│   │   └── celery_app.py
│   └── utils/                  # Utility functions
│       ├── __init__.py
│       ├── security.py
│       └── helpers.py
├── requirements.txt
├── pyproject.toml
├── Dockerfile
└── docker-compose.yml
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables

Create `.env` file:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Azure Computer Vision
AZURE_VISION_ENDPOINT=your_azure_endpoint
AZURE_VISION_KEY=your_azure_key

# Redis
REDIS_URL=redis://localhost:6379/0

# FastAPI
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_image_gallery
```

### 3. Start Services

```bash
# Start Redis (required for Celery)
redis-server

# Start Celery worker (in separate terminal)
celery -A app.tasks.celery_app worker --loglevel=info

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📦 Dependencies

### Core Dependencies

```txt
# FastAPI and related
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0

# Database
supabase==2.0.2
psycopg2-binary==2.9.9
sqlalchemy==2.0.23

# Background Jobs
celery==5.3.4
redis==5.0.1

# HTTP Client
httpx==0.25.2
aiofiles==23.2.1

# Image Processing
Pillow==10.1.0
opencv-python==4.8.1.78

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# Utilities
python-dotenv==1.0.0
```

### Development Dependencies

```txt
# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2

# Code Quality
black==23.11.0
isort==5.12.0
flake8==6.1.0
mypy==1.7.1

# Documentation
mkdocs==1.5.3
mkdocs-material==9.4.8
```

## 🔧 Configuration

### FastAPI Configuration

```python
# app/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_anon_key: str
    
    # Azure Computer Vision
    azure_vision_endpoint: str
    azure_vision_key: str
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # API
    api_v1_str: str = "/api/v1"
    project_name: str = "AI Image Gallery"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Celery Configuration

```python
# app/tasks/celery_app.py
from celery import Celery
from app.config import settings

celery_app = Celery(
    "ai_processing",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.ai_processing"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
```

## 🔌 API Endpoints

### Image Management

```python
# app/api/images.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.models.image import ImageCreate, ImageResponse
from app.auth import get_current_user

router = APIRouter(prefix="/images", tags=["images"])

@router.post("/upload", response_model=ImageResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Upload a single image"""
    # Implementation here
    pass

@router.post("/upload-multiple")
async def upload_multiple_images(
    files: list[UploadFile] = File(...),
    current_user = Depends(get_current_user)
):
    """Upload multiple images"""
    # Implementation here
    pass

@router.get("/", response_model=list[ImageResponse])
async def get_images(
    page: int = 1,
    limit: int = 20,
    current_user = Depends(get_current_user)
):
    """Get user's images with pagination"""
    # Implementation here
    pass

@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: int,
    current_user = Depends(get_current_user)
):
    """Get specific image"""
    # Implementation here
    pass

@router.delete("/{image_id}")
async def delete_image(
    image_id: int,
    current_user = Depends(get_current_user)
):
    """Delete image"""
    # Implementation here
    pass
```

### Search Endpoints

```python
# app/api/search.py
from fastapi import APIRouter, Depends, Query
from app.models.search import SearchResponse
from app.auth import get_current_user

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/images", response_model=SearchResponse)
async def search_images(
    q: str = Query(None, description="Search query"),
    color: str = Query(None, description="Color filter (hex code)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """Search images by text and color"""
    # Implementation here
    pass

@router.get("/images/{image_id}/similar")
async def find_similar_images(
    image_id: int,
    limit: int = Query(10, ge=1, le=50),
    current_user = Depends(get_current_user)
):
    """Find similar images"""
    # Implementation here
    pass
```

## 🔄 Background Processing

### AI Processing Task

```python
# app/tasks/ai_processing.py
from celery import Celery
from app.services.azure_vision import analyze_image
from app.database import get_supabase_client
from app.tasks.celery_app import celery_app

@celery_app.task
def process_image_ai(image_id: int, image_url: str):
    """Background task to process image with AI"""
    try:
        # Call Azure Computer Vision API
        ai_result = analyze_image(image_url)
        
        # Update database
        supabase = get_supabase_client()
        supabase.table('image_metadata').update({
            'description': ai_result['description'],
            'tags': ai_result['tags'],
            'colors': ai_result['colors'],
            'ai_processing_status': 'completed',
            'ai_processed_at': datetime.utcnow().isoformat()
        }).eq('image_id', image_id).execute()
        
        return {'success': True, 'image_id': image_id}
    except Exception as error:
        # Update with error status
        supabase = get_supabase_client()
        supabase.table('image_metadata').update({
            'ai_processing_status': 'failed',
            'ai_error_message': str(error)
        }).eq('image_id', image_id).execute()
        
        raise error
```

### Triggering Background Jobs

```python
# app/services/image_processing.py
from app.tasks.ai_processing import process_image_ai

async def trigger_ai_processing(image_id: int, image_url: str):
    """Trigger AI processing for uploaded image"""
    # Queue the background job
    task = process_image_ai.delay(image_id, image_url)
    
    # Update status to processing
    supabase = get_supabase_client()
    supabase.table('image_metadata').update({
        'ai_processing_status': 'processing'
    }).eq('image_id', image_id).execute()
    
    return task.id
```

## 🔐 Authentication

### Supabase Integration

```python
# app/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.config import settings

security = HTTPBearer()

def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_key)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        supabase = get_supabase_client()
        response = supabase.auth.get_user(credentials.credentials)
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        return response.user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
```

## 🧪 Testing

### Unit Tests

```python
# tests/test_images.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_upload_image():
    response = client.post("/api/v1/images/upload")
    assert response.status_code == 401  # Unauthorized without token

def test_search_images():
    response = client.get("/api/v1/search/images?q=sunset")
    assert response.status_code == 401  # Unauthorized without token
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_images.py
```

## 🚀 Deployment

### Docker Setup

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    volumes:
      - .:/app

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  celery:
    build: .
    command: celery -A app.tasks.celery_app worker --loglevel=info
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    volumes:
      - .:/app
```

### Production Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or deploy to cloud platforms
# Railway, Render, DigitalOcean, etc.
```

## 📊 Monitoring

### Health Check

```python
# app/api/health.py
from fastapi import APIRouter
from app.tasks.celery_app import celery_app

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "celery": celery_app.control.inspect().active() is not None
    }
```

### Logging

```python
# app/config.py
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)
```

## 🔧 Development

### Code Quality

```bash
# Format code
black app/
isort app/

# Lint code
flake8 app/

# Type checking
mypy app/
```

### API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

*This FastAPI backend provides a robust, scalable foundation for the AI Image Gallery application with proper separation of concerns, background processing, and comprehensive API endpoints.*
