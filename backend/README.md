# AI Image Gallery - FastAPI Backend

A simple and robust FastAPI backend for the AI Image Gallery application with Azure Computer Vision integration and easy-to-use background processing.

## 🚀 Features

- **FastAPI Framework**: Modern, fast, and easy-to-use web framework
- **Supabase Integration**: Database, authentication, and storage
- **Azure Computer Vision**: AI-powered image analysis
- **Background Processing**: Simple async processing with Python's asyncio
- **Image Management**: Upload, storage, thumbnails, and optimization
- **Search & Filtering**: Advanced search with AI-generated metadata
- **Authentication**: Supabase Auth integration
- **Comprehensive API**: RESTful endpoints with OpenAPI documentation

## 📋 Prerequisites

- Python 3.11+
- Supabase project
- Azure Computer Vision API key

**That's it!** No Redis, no Celery, no complex setup needed.

## 🛠️ Installation

### 1. Clone and Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
# Create .env file with your credentials
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase service key
- `AZURE_VISION_ENDPOINT`: Azure Computer Vision endpoint
- `AZURE_VISION_KEY`: Azure Computer Vision API key

### 3. Start the Server

```bash
# That's it! Just one command:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Super simple!** No Redis, no Celery workers, no multiple terminals needed.

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Build and start the service (just one service!)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop service
docker-compose down
```

**Much simpler!** Just one service instead of multiple.

### Individual Docker Run

```bash
# Build the image
docker build -t ai-image-gallery-backend .

# Run with environment file
docker run -d --env-file .env -p 8000:8000 ai-image-gallery-backend
```

**One container, one service, done!**

## 📚 API Documentation

Once running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

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

### Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_images.py
```

## 📊 Monitoring

### Health Checks

- **Basic**: `GET /api/v1/health`
- **Detailed**: `GET /api/v1/health/detailed`
- **Readiness**: `GET /api/v1/health/ready`
- **Liveness**: `GET /api/v1/health/live`

### Background Processing Monitoring

- **Processing Status**: Check API logs for background task status
- **Task Queue**: Built-in asyncio task tracking (no external monitoring needed)

## 🏗️ Architecture

### Core Components

1. **FastAPI Application** (`app/main.py`)
   - Main application entry point
   - CORS and middleware configuration
   - Route registration

2. **Authentication** (`app/auth.py`)
   - Supabase Auth integration
   - JWT token validation
   - User permission checks

3. **Services** (`app/services/`)
   - Azure Vision service for AI analysis
   - Storage service for file management
   - Image processing for thumbnails

4. **Background Processing** (`app/services/ai_processing.py`)
   - Simple async AI processing
   - Built-in task management
   - No external dependencies

5. **API Endpoints** (`app/api/`)
   - Image management endpoints
   - Search and filtering
   - Health check endpoints

6. **Data Models** (`app/models/`)
   - Pydantic models for validation
   - Request/response schemas
   - Type definitions

### Database Schema

The backend uses Supabase PostgreSQL with the following key tables:

- `images`: Image metadata and AI analysis results
- `users`: User information (managed by Supabase Auth)

### Background Processing Flow

1. User uploads image via API
2. Image stored in Supabase Storage
3. Database record created with `processing_status: pending`
4. Background task started using Python's asyncio
5. Azure Computer Vision analyzes image
6. Results stored in database
7. Status updated to `completed`

**Simple and reliable!** No complex message queues needed.

## 🔒 Security

- **Authentication**: Supabase JWT tokens
- **Authorization**: User-based access control
- **File Validation**: Type and size restrictions
- **CORS**: Configurable origins
- **Rate Limiting**: Built-in protection

## 🚀 Production Deployment

### Environment Setup

1. Set production environment variables
2. Configure proper CORS origins
3. Set up monitoring and logging

**No Redis to manage!** Much simpler production setup.

### Scaling

- **Horizontal Scaling**: Multiple API instances
- **Load Balancing**: Nginx or cloud load balancer
- **Simple Scaling**: Just scale the FastAPI service

**No complex Redis clustering needed!**

### Monitoring

- **Application Metrics**: FastAPI built-in metrics
- **Background Processing**: Built-in asyncio task monitoring
- **Health Checks**: Kubernetes-ready endpoints
- **Logging**: Structured logging with levels

**Simple monitoring!** No external services to monitor.

## 📝 API Endpoints

### Images
- `POST /api/v1/images/upload` - Upload image
- `GET /api/v1/images/` - List user images
- `GET /api/v1/images/{id}` - Get specific image
- `DELETE /api/v1/images/{id}` - Delete image
- `POST /api/v1/images/{id}/retry-processing` - Retry AI processing
- `GET /api/v1/images/{id}/download` - Download image

### Search
- `GET /api/v1/search/images` - Search images
- `GET /api/v1/search/images/{id}/similar` - Find similar images
- `GET /api/v1/search/suggestions` - Get search suggestions

### Health
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health status

## 🔧 Configuration

All configuration is handled through environment variables. See `.env.example` for all available options.

Key configuration areas:
- **Database**: Supabase connection settings
- **AI Services**: Azure Computer Vision credentials
- **Background Processing**: Simple async configuration
- **Security**: JWT and CORS settings
- **File Upload**: Size limits and allowed types

**Much simpler configuration!** No Redis or Celery settings needed.

## 🐛 Troubleshooting

### Common Issues

1. **Azure Vision API Errors**
   - Verify API credentials
   - Check rate limits and quotas

2. **Supabase Connection Issues**
   - Verify project URL and keys
   - Check network connectivity

3. **Background Processing Issues**
   - Check API logs for processing status
   - Verify image URLs are accessible
   - Check concurrent processing limits

**Much fewer issues to troubleshoot!** No Redis or Celery problems.

### Debug Mode

```bash
# Run with debug logging
LOG_LEVEL=DEBUG uvicorn app.main:app --reload
```

## 📄 License

This project is part of the AI Image Gallery application.

---

For more information, see the main project documentation.
