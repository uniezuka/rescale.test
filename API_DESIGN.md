# API Design - AI Image Gallery

## 🔌 API Overview

The API is built using Supabase Edge Functions and follows RESTful principles. All endpoints require authentication and use Row Level Security (RLS) to ensure data isolation between users.

## 🔐 Authentication

All API requests require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 📡 API Endpoints

### 1. Image Management

#### Upload Image
**POST** `/api/images/upload`

Upload a single image with automatic thumbnail generation.

**Request:**
```typescript
interface UploadImageRequest {
  file: File;
  filename: string;
}
```

**Response:**
```typescript
interface UploadImageResponse {
  success: boolean;
  data: {
    id: number;
    filename: string;
    original_path: string;
    thumbnail_path: string;
    file_size: number;
    mime_type: string;
    width: number;
    height: number;
    uploaded_at: string;
  };
  error?: string;
}
```

**Example:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/upload-image \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@image.jpg" \
  -F "filename=image.jpg"
```

#### Upload Multiple Images
**POST** `/api/images/upload-multiple`

Upload multiple images in a single request.

**Request:**
```typescript
interface UploadMultipleImagesRequest {
  files: File[];
  filenames: string[];
}
```

**Response:**
```typescript
interface UploadMultipleImagesResponse {
  success: boolean;
  data: {
    uploaded: Array<{
      id: number;
      filename: string;
      original_path: string;
      thumbnail_path: string;
    }>;
    failed: Array<{
      filename: string;
      error: string;
    }>;
  };
  error?: string;
}
```

#### Get Images
**GET** `/api/images`

Get user's images with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by processing status (`pending`, `processing`, `completed`, `failed`)
- `sort` (string): Sort order (`newest`, `oldest`, `filename`)
- `search` (string): Search query for tags or description

**Response:**
```typescript
interface GetImagesResponse {
  success: boolean;
  data: {
    images: Array<{
      id: number;
      filename: string;
      original_path: string;
      thumbnail_path: string;
      file_size: number;
      mime_type: string;
      width: number;
      height: number;
      uploaded_at: string;
      metadata?: {
        description: string;
        tags: string[];
        colors: string[];
        ai_processing_status: string;
        ai_processed_at: string;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
  error?: string;
}
```

**Example:**
```bash
curl -X GET "https://your-project.supabase.co/functions/v1/images?page=1&limit=20&status=completed" \
  -H "Authorization: Bearer <token>"
```

#### Get Image by ID
**GET** `/api/images/{id}`

Get a specific image with its metadata.

**Response:**
```typescript
interface GetImageResponse {
  success: boolean;
  data: {
    id: number;
    filename: string;
    original_path: string;
    thumbnail_path: string;
    file_size: number;
    mime_type: string;
    width: number;
    height: number;
    uploaded_at: string;
    metadata: {
      description: string;
      tags: string[];
      colors: string[];
      ai_processing_status: string;
      ai_processed_at: string;
      ai_error_message?: string;
    };
  };
  error?: string;
}
```

#### Delete Image
**DELETE** `/api/images/{id}`

Delete an image and all associated data.

**Response:**
```typescript
interface DeleteImageResponse {
  success: boolean;
  message: string;
  error?: string;
}
```

### 2. Search and Filter

#### Search Images
**GET** `/api/images/search`

Search images by text query.

**Query Parameters:**
- `q` (string): Search query
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `type` (string): Search type (`all`, `tags`, `description`)

**Response:**
```typescript
interface SearchImagesResponse {
  success: boolean;
  data: {
    images: Array<{
      id: number;
      filename: string;
      thumbnail_path: string;
      uploaded_at: string;
      metadata: {
        description: string;
        tags: string[];
        colors: string[];
      };
      relevance_score: number;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
    query: string;
  };
  error?: string;
}
```

#### Filter by Color
**GET** `/api/images/filter/color`

Filter images by dominant color.

**Query Parameters:**
- `color` (string): Hex color code (e.g., `#FF0000`)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Response:**
```typescript
interface FilterByColorResponse {
  success: boolean;
  data: {
    images: Array<{
      id: number;
      filename: string;
      thumbnail_path: string;
      uploaded_at: string;
      metadata: {
        description: string;
        tags: string[];
        colors: string[];
      };
      color_match_score: number;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
    filter_color: string;
  };
  error?: string;
}
```

#### Find Similar Images
**GET** `/api/images/{id}/similar`

Find images similar to a specific image.

**Query Parameters:**
- `limit` (number): Number of similar images to return (default: 10, max: 50)

**Response:**
```typescript
interface FindSimilarImagesResponse {
  success: boolean;
  data: {
    original_image: {
      id: number;
      filename: string;
      thumbnail_path: string;
      metadata: {
        description: string;
        tags: string[];
        colors: string[];
      };
    };
    similar_images: Array<{
      id: number;
      filename: string;
      thumbnail_path: string;
      uploaded_at: string;
      metadata: {
        description: string;
        tags: string[];
        colors: string[];
      };
      similarity_score: number;
      common_tags: string[];
    }>;
  };
  error?: string;
}
```

### 3. AI Processing

#### Process Image AI
**POST** `/api/images/{id}/process-ai`

Manually trigger AI processing for an image.

**Response:**
```typescript
interface ProcessImageAIResponse {
  success: boolean;
  message: string;
  data?: {
    processing_id: string;
    estimated_completion_time: string;
  };
  error?: string;
}
```

#### Get Processing Status
**GET** `/api/images/processing-status`

Get the processing status of all user's images.

**Response:**
```typescript
interface ProcessingStatusResponse {
  success: boolean;
  data: {
    total_images: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    processing_queue: Array<{
      id: number;
      filename: string;
      status: string;
      started_at?: string;
      error_message?: string;
    }>;
  };
  error?: string;
}
```

### 4. User Management

#### Get User Profile
**GET** `/api/user/profile`

Get current user's profile information.

**Response:**
```typescript
interface UserProfileResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    created_at: string;
    preferences: {
      items_per_page: number;
      default_view: string;
      theme: string;
      auto_process_images: boolean;
    };
    statistics: {
      total_images: number;
      total_storage_used: number;
      last_upload: string;
    };
  };
  error?: string;
}
```

#### Update User Preferences
**PUT** `/api/user/preferences`

Update user's preferences.

**Request:**
```typescript
interface UpdatePreferencesRequest {
  items_per_page?: number;
  default_view?: 'grid' | 'list';
  theme?: 'light' | 'dark' | 'auto';
  auto_process_images?: boolean;
}
```

**Response:**
```typescript
interface UpdatePreferencesResponse {
  success: boolean;
  data: {
    items_per_page: number;
    default_view: string;
    theme: string;
    auto_process_images: boolean;
  };
  error?: string;
}
```

### 5. Analytics

#### Get User Statistics
**GET** `/api/user/statistics`

Get user's usage statistics.

**Response:**
```typescript
interface UserStatisticsResponse {
  success: boolean;
  data: {
    total_images: number;
    total_storage_used: number;
    images_by_month: Array<{
      month: string;
      count: number;
    }>;
    storage_by_month: Array<{
      month: string;
      size: number;
    }>;
    most_common_tags: Array<{
      tag: string;
      count: number;
    }>;
    most_common_colors: Array<{
      color: string;
      count: number;
    }>;
  };
  error?: string;
}
```

## 🔄 Real-time Subscriptions

### Image Processing Updates
Subscribe to real-time updates for image processing status.

```typescript
// Subscribe to processing updates
const subscription = supabase
  .channel('image-processing')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'image_metadata',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Processing update:', payload);
    // Update UI with new processing status
  })
  .subscribe();
```

### New Image Uploads
Subscribe to new image uploads.

```typescript
// Subscribe to new uploads
const subscription = supabase
  .channel('new-images')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'images',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('New image uploaded:', payload);
    // Add new image to UI
  })
  .subscribe();
```

## 🚨 Error Handling

### Error Response Format
All error responses follow this format:

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: User not authenticated
- `INVALID_TOKEN`: Invalid or expired token
- `INSUFFICIENT_PERMISSIONS`: User doesn't have permission
- `VALIDATION_ERROR`: Request validation failed
- `FILE_TOO_LARGE`: Uploaded file exceeds size limit
- `UNSUPPORTED_FILE_TYPE`: File type not supported
- `AI_PROCESSING_FAILED`: AI analysis failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Server error

### Error Examples
```typescript
// Authentication error
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTHENTICATION_REQUIRED"
}

// Validation error
{
  "success": false,
  "error": "Invalid file type. Only JPEG and PNG are supported.",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "file",
    "value": "document.pdf"
  }
}

// AI processing error
{
  "success": false,
  "error": "AI processing failed",
  "code": "AI_PROCESSING_FAILED",
  "details": {
    "image_id": 123,
    "error_message": "API rate limit exceeded"
  }
}
```

## 📊 Rate Limiting

### Rate Limits
- **Image Upload**: 10 requests per minute
- **Search**: 60 requests per minute
- **AI Processing**: 5 requests per minute
- **General API**: 100 requests per minute

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response
```typescript
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}
```

## 🔒 Security Considerations

### Input Validation
- File type validation (JPEG, PNG only)
- File size limits (10MB max)
- Image dimension limits (10,000x10,000 max)
- SQL injection prevention
- XSS prevention

### Authentication
- JWT token validation
- Token expiration handling
- Refresh token rotation
- Secure token storage

### Data Protection
- Row Level Security (RLS)
- Encrypted data transmission
- Secure file storage
- API key protection

## 📈 Performance Considerations

### Caching
- Redis caching for frequently accessed data
- CDN for image delivery
- Browser caching for static assets

### Pagination
- Cursor-based pagination for large datasets
- Configurable page sizes
- Total count optimization

### Database Optimization
- Proper indexing
- Query optimization
- Connection pooling
- Read replicas for analytics

## 🧪 Testing

### API Testing Examples

#### Test Image Upload
```bash
# Test successful upload
curl -X POST https://your-project.supabase.co/functions/v1/upload-image \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-image.jpg" \
  -F "filename=test-image.jpg"

# Test invalid file type
curl -X POST https://your-project.supabase.co/functions/v1/upload-image \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf" \
  -F "filename=document.pdf"
```

#### Test Search
```bash
# Test text search
curl -X GET "https://your-project.supabase.co/functions/v1/images/search?q=sunset&page=1&limit=10" \
  -H "Authorization: Bearer <token>"

# Test color filter
curl -X GET "https://your-project.supabase.co/functions/v1/images/filter/color?color=%23FF0000&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Load Testing
```bash
# Test with Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
  "https://your-project.supabase.co/functions/v1/images?page=1&limit=20"
```

## 📚 API Documentation

### OpenAPI Specification
The API follows OpenAPI 3.0 specification and can be documented using Swagger UI.

### Interactive Documentation
- Swagger UI for testing endpoints
- Postman collection for API testing
- cURL examples for each endpoint

### SDK Generation
- TypeScript client SDK
- JavaScript client SDK
- Python client SDK (if needed)

---

*This API design provides a comprehensive and secure interface for the AI Image Gallery application with proper error handling, rate limiting, and performance considerations.*
