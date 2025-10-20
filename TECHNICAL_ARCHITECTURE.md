# Technical Architecture - AI Image Gallery

## 🏗️ System Architecture Overview

### Current Implementation (Phase 1-4 Complete) ✅
```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Auth      │  │   Gallery   │  │   Upload    │  │ Image   │ │
│  │   Pages     │  │   View      │  │   Zone      │  │ Modal   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Services                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Auth      │  │  Database   │  │  Storage    │            │
│  │  Service    │  │ (PostgreSQL)│  │  Service    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Future Architecture (Phase 5 Planned) 📋
```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Auth      │  │   Gallery   │  │   Upload    │  │ Search  │ │
│  │   Pages     │  │   View      │  │   Zone      │  │  UI     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Edge Functions                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   API       │  │  Background │  │   Real-time │            │
│  │  Endpoints  │  │  Processing │  │  Updates    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Services                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Auth      │  │  Database   │  │  Storage    │            │
│  │  Service    │  │ (PostgreSQL)│  │  Service    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External AI Services                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Azure Computer Vision API                     │ │
│  │         (Tag Generation, Descriptions, Colors)             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Frontend Stack (Current)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite (fast development and building)
- **Styling**: Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **Routing**: React Router v7
- **File Upload**: React Dropzone
- **HTTP Client**: Supabase JavaScript Client
- **Image Processing**: Browser Image Compression
- **Testing**: Jest + React Testing Library

### Backend Stack (Current)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **API**: Supabase Client (Direct integration)

### Future Backend Stack (Phase 3+)
- **API**: Supabase Edge Functions (Deno)
- **AI Processing**: Azure Computer Vision API
- **Background Jobs**: Supabase Edge Functions
- **Real-time**: Supabase Real-time subscriptions

### Development Tools
- **Frontend Package Manager**: npm
- **Backend Package Manager**: pip/poetry
- **Frontend Linting**: ESLint + Prettier
- **Backend Linting**: Black + isort + flake8
- **Type Checking**: TypeScript (frontend) + mypy (backend)
- **Version Control**: Git
- **Environment**: Node.js 18+ (frontend), Python 3.11+ (backend)

### Deployment
- **Frontend**: Vercel (recommended) or Netlify
- **Backend**: Railway, Render, or DigitalOcean
- **Database**: Supabase (managed)
- **Background Jobs**: Redis (managed service)
- **Domain**: Custom domain (optional)

## 📊 Database Architecture

### Core Tables

#### 1. Images Table
```sql
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_path TEXT NOT NULL,
    thumbnail_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Image Metadata Table
```sql
CREATE TABLE image_metadata (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    description TEXT,
    tags TEXT[],
    colors VARCHAR(7)[],
    ai_processing_status VARCHAR(20) DEFAULT 'pending',
    ai_processed_at TIMESTAMP,
    ai_error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Search Index Table (for performance)
```sql
CREATE TABLE search_index (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    search_vector tsvector,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance
```sql
-- Performance indexes
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_uploaded_at ON images(uploaded_at DESC);
CREATE INDEX idx_image_metadata_user_id ON image_metadata(user_id);
CREATE INDEX idx_image_metadata_tags ON image_metadata USING GIN(tags);
CREATE INDEX idx_image_metadata_colors ON image_metadata USING GIN(colors);
CREATE INDEX idx_image_metadata_status ON image_metadata(ai_processing_status);
CREATE INDEX idx_search_vector ON search_index USING GIN(search_vector);

-- Composite indexes for common queries
CREATE INDEX idx_images_user_uploaded ON images(user_id, uploaded_at DESC);
CREATE INDEX idx_metadata_user_status ON image_metadata(user_id, ai_processing_status);
```

### Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only see own images" ON images
    FOR ALL USING (auth.uid() = user_id);
    
CREATE POLICY "Users can only see own metadata" ON image_metadata
    FOR ALL USING (auth.uid() = user_id);
    
CREATE POLICY "Users can only see own search index" ON search_index
    FOR ALL USING (auth.uid() = user_id);
```

## 🔄 Data Flow Architecture

### 1. Image Upload Flow
```
User uploads image
    ↓
Frontend validates file (type, size)
    ↓
Upload to Supabase Storage (user_id/filename)
    ↓
Generate thumbnail (300x300) using Canvas API
    ↓
Upload thumbnail to Supabase Storage
    ↓
Save image record to database
    ↓
Create metadata record with status 'pending'
    ↓
Trigger background AI processing
    ↓
Update UI with uploaded image
```

### 2. AI Processing Flow
```
FastAPI receives upload request
    ↓
Queue background job with Celery
    ↓
Celery worker downloads image from Supabase Storage
    ↓
Call Azure Computer Vision API
    ↓
Process API response:
    - Extract tags (5-10 most relevant)
    - Extract description (first caption)
    - Extract colors (top 3 dominant)
    ↓
Update metadata record with results
    ↓
Update search index
    ↓
Update processing status to 'completed'
    ↓
Notify frontend via WebSocket
```

### 3. Search Flow
```
User enters search query
    ↓
Frontend debounces input (300ms)
    ↓
Query database with RLS:
    - Text search in tags and description
    - Color filtering if color selected
    - Similarity search for "find similar"
    ↓
Return paginated results (20 per page)
    ↓
Update UI with results
    ↓
Handle loading states and errors
```

## 🎨 Frontend Architecture

### Component Hierarchy
```
App
├── AuthProvider (Context)
├── Router
│   ├── PublicRoute
│   │   ├── LoginPage
│   │   └── SignupPage
│   └── ProtectedRoute
│       └── GalleryPage
│           ├── Header
│           │   ├── SearchBar
│           │   ├── ColorFilter
│           │   └── UserMenu
│           ├── UploadZone
│           │   ├── Dropzone
│           │   └── UploadProgress
│           ├── ImageGrid
│           │   ├── ImageCard
│           │   └── Pagination
│           └── ImageModal
│               ├── ImageViewer
│               ├── MetadataDisplay
│               └── SimilarImages
```

### State Management
```typescript
// Global State Structure
interface AppState {
  user: User | null;
  images: Image[];
  searchQuery: string;
  selectedColor: string | null;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

// Context Actions
type AppAction = 
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_IMAGES'; payload: Image[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_COLOR'; payload: string | null }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };
```

## 🔌 API Architecture

### FastAPI Backend

#### 1. Process Image AI
```python
# app/tasks/ai_processing.py
from celery import Celery
from app.services.azure_vision import analyze_image
from app.database import get_supabase_client

celery = Celery('ai_processing')

@celery.task
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
        
        return {'success': True}
    except Exception as error:
        # Update with error status
        supabase = get_supabase_client()
        supabase.table('image_metadata').update({
            'ai_processing_status': 'failed',
            'ai_error_message': str(error)
        }).eq('image_id', image_id).execute()
        
        raise error
```

#### 2. Search Images
```python
# app/api/images.py
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_supabase_client
from app.auth import get_current_user

router = APIRouter()

@router.get("/search")
async def search_images(
    query: str = None,
    color: str = None,
    page: int = 1,
    limit: int = 20,
    current_user = Depends(get_current_user)
):
    """Search images by text query and color filter"""
    supabase = get_supabase_client()
    
    # Build query
    db_query = supabase.table('images').select("""
        *,
        image_metadata(*)
    """).eq('user_id', current_user.id).eq('image_metadata.ai_processing_status', 'completed')
    
    # Text search
    if query:
        db_query = db_query.or_(f"image_metadata.tags.cs.{{{query}}},image_metadata.description.ilike.%{query}%")
    
    # Color filter
    if color:
        db_query = db_query.contains('image_metadata.colors', [color])
    
    # Pagination
    from_index = (page - 1) * limit
    to_index = from_index + limit - 1
    db_query = db_query.range(from_index, to_index)
    
    response = db_query.execute()
    
    if response.data is None:
        raise HTTPException(status_code=500, detail="Database error")
    
    return {"images": response.data}
```

## 🔐 Security Architecture

### Authentication Flow
```
User login/signup
    ↓
Supabase Auth validates credentials
    ↓
JWT token issued
    ↓
Token stored in secure HTTP-only cookie
    ↓
All API requests include token
    ↓
Supabase validates token
    ↓
RLS policies enforce user isolation
```

### Data Protection
- **Row Level Security**: All database queries filtered by user_id
- **API Key Security**: Azure API key stored in Supabase secrets
- **File Upload Security**: File type validation, size limits
- **CORS Configuration**: Restricted to frontend domain
- **Rate Limiting**: Implemented at Edge Function level

## 📈 Performance Architecture

### Frontend Optimizations
- **Image Lazy Loading**: Intersection Observer API
- **Virtual Scrolling**: For large image grids
- **Debounced Search**: 300ms delay on search input
- **Optimistic Updates**: Immediate UI updates
- **Caching**: React Query for API responses
- **Code Splitting**: Route-based code splitting

### Backend Optimizations
- **Database Indexing**: Optimized for common queries
- **Connection Pooling**: Supabase handles automatically
- **Caching**: Redis for frequently accessed data
- **Background Processing**: Non-blocking AI analysis
- **CDN**: Supabase Storage with global CDN

### Storage Optimizations
- **Image Compression**: Automatic compression on upload
- **Thumbnail Generation**: Client-side using Canvas API
- **Progressive Loading**: Show thumbnails first, then originals
- **Cleanup**: Automatic cleanup of failed uploads

## 🚀 Deployment Architecture

### Development Environment
```
Local Machine
├── React Dev Server (Vite)
├── Supabase Local Development
└── Azure Computer Vision API (Sandbox)
```

### Production Environment
```
Vercel (Frontend)
├── Static Site Generation
├── Edge Functions (if needed)
└── CDN Distribution

Supabase (Backend)
├── PostgreSQL Database
├── Authentication Service
├── Storage Service
├── Edge Functions
└── Real-time Subscriptions

Azure (AI Services)
├── Computer Vision API
├── API Management
└── Monitoring & Analytics
```

## 📊 Monitoring & Analytics

### Application Monitoring
- **Error Tracking**: Sentry or similar
- **Performance Monitoring**: Web Vitals
- **User Analytics**: Privacy-focused analytics
- **API Monitoring**: Supabase dashboard

### Business Metrics
- **User Registrations**: Track signup rates
- **Image Uploads**: Monitor usage patterns
- **Search Queries**: Analyze search behavior
- **AI Processing**: Track success/failure rates

## 🔧 Development Workflow

### Local Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Set up Supabase project
4. Configure environment variables
5. Run development server: `npm run dev`
6. Set up Azure Computer Vision API

### Environment Variables
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Azure Computer Vision
AZURE_VISION_ENDPOINT=your_azure_endpoint
AZURE_VISION_KEY=your_azure_key

# Development
NODE_ENV=development
```

### Git Workflow
- **Main Branch**: Production-ready code
- **Develop Branch**: Integration branch
- **Feature Branches**: Individual features
- **Hotfix Branches**: Critical fixes

## 🧪 Testing Strategy

### Unit Tests
- **Components**: React Testing Library
- **Utilities**: Jest
- **API Functions**: Mock Supabase client

### Integration Tests
- **Authentication Flow**: E2E testing
- **Upload Process**: Mock file uploads
- **Search Functionality**: Test with sample data

### E2E Tests
- **User Workflows**: Playwright or Cypress
- **Cross-browser Testing**: Multiple browsers
- **Mobile Testing**: Responsive design validation

## 📚 Documentation

### Technical Documentation
- **API Documentation**: OpenAPI/Swagger
- **Database Schema**: ERD diagrams
- **Component Documentation**: Storybook
- **Deployment Guide**: Step-by-step instructions

### User Documentation
- **User Guide**: How to use the application
- **FAQ**: Common questions and answers
- **Troubleshooting**: Common issues and solutions

---

*This architecture document will be updated as the project evolves and requirements change.*
