# Migration from Edge Functions to FastAPI

## 🎯 **Migration Overview**

This guide helps you migrate from the problematic Supabase Edge Functions to the robust FastAPI backend solution.

## 🔍 **Current Issues with Edge Functions**

Based on the project documentation, the following issues were encountered:

### 1. **Deployment Problems**
- ❌ Edge Functions not properly deployed
- ❌ Missing environment variables in Edge Function environment
- ❌ Difficult deployment process requiring Supabase CLI

### 2. **Processing Issues**
- ❌ Images stuck in "processing" status
- ❌ No timeout protection (initially)
- ❌ Status updates not working properly
- ❌ Silent failures in AI processing

### 3. **Debugging Challenges**
- ❌ Limited error visibility
- ❌ Hard to troubleshoot when things go wrong
- ❌ No comprehensive logging

### 4. **Reliability Issues**
- ❌ Cold start latency
- ❌ Network connectivity problems
- ❌ Rate limiting complications

## ✅ **Benefits of FastAPI Migration**

### 1. **Reliability**
- ✅ No cold start issues
- ✅ Consistent performance
- ✅ Robust error handling
- ✅ Automatic retry mechanisms

### 2. **Better Debugging**
- ✅ Comprehensive logging
- ✅ Health check endpoints
- ✅ Real-time monitoring
- ✅ Detailed error messages

### 3. **Scalability**
- ✅ Horizontal scaling support
- ✅ Load balancing ready
- ✅ Background job processing
- ✅ Queue management

### 4. **Development Experience**
- ✅ Standard Python development
- ✅ Local testing capabilities
- ✅ Docker support
- ✅ Easy deployment options

## 🔄 **Migration Steps**

### Step 1: Prepare the FastAPI Backend

1. **Set up the backend directory structure**
   ```bash
   mkdir backend
   cd backend
   # Copy all FastAPI files from the implementation
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

### Step 2: Update Frontend Configuration

#### Update API Base URL

**Before (Edge Functions):**
```typescript
// Frontend was calling Supabase functions directly
const { data, error } = await supabase.functions.invoke('process-image', {
  body: { imageId, imageUrl }
});
```

**After (FastAPI):**
```typescript
// Update your API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com/api/v1'
  : 'http://localhost:8000/api/v1';

// Update your API calls
const response = await fetch(`${API_BASE_URL}/images/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: formData
});
```

#### Update Authentication

The authentication flow remains the same (Supabase Auth), but you need to pass the JWT token to FastAPI:

```typescript
// Get the current session
const { data: { session } } = await supabase.auth.getSession();

// Use the token in API calls
const response = await fetch(`${API_BASE_URL}/images/`, {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  }
});
```

### Step 3: Update Image Upload Flow

#### Before (Edge Functions)
```typescript
// Old upload flow
const uploadImage = async (file: File) => {
  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('images')
    .upload(`${user.id}/${file.name}`, file);
  
  if (uploadError) throw uploadError;
  
  // Save to database
  const { data: dbData, error: dbError } = await supabase
    .from('images')
    .insert({
      user_id: user.id,
      original_filename: file.name,
      storage_path: uploadData.path,
      processing_status: 'pending'
    });
  
  if (dbError) throw dbError;
  
  // Call Edge Function for AI processing
  const { data: aiData, error: aiError } = await supabase.functions.invoke('process-image', {
    body: {
      imageId: dbData[0].id,
      imageUrl: uploadData.publicUrl
    }
  });
  
  if (aiError) throw aiError;
  
  return aiData;
};
```

#### After (FastAPI)
```typescript
// New upload flow
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Get authentication token
  const { data: { session } } = await supabase.auth.getSession();
  
  // Upload via FastAPI
  const response = await fetch(`${API_BASE_URL}/images/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result;
};
```

### Step 4: Update Image Gallery

#### Before (Direct Supabase)
```typescript
// Old gallery loading
const loadImages = async () => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};
```

#### After (FastAPI API)
```typescript
// New gallery loading
const loadImages = async (page = 1, limit = 20) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(`${API_BASE_URL}/images/?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to load images: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result;
};
```

### Step 5: Update Search Functionality

#### Before (Direct Database)
```typescript
// Old search
const searchImages = async (query: string) => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', user.id)
    .or(`ai_description.ilike.%${query}%,ai_tags.cs.{${query}}`);
  
  if (error) throw error;
  return data;
};
```

#### After (FastAPI API)
```typescript
// New search
const searchImages = async (query: string, filters = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const params = new URLSearchParams({
    q: query,
    ...filters
  });
  
  const response = await fetch(`${API_BASE_URL}/search/images?${params}`, {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result;
};
```

### Step 6: Update Real-time Updates

#### Before (Supabase Real-time)
```typescript
// Old real-time updates
const subscribeToUpdates = () => {
  const subscription = supabase
    .channel('image-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'images',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      console.log('Image updated:', payload);
      // Update UI
    })
    .subscribe();
  
  return subscription;
};
```

#### After (Hybrid Approach)
```typescript
// New real-time updates (still using Supabase real-time for UI updates)
const subscribeToUpdates = () => {
  const subscription = supabase
    .channel('image-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'images',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      console.log('Image updated:', payload);
      // Update UI
    })
    .subscribe();
  
  return subscription;
};

// The FastAPI backend handles the processing, but we still use Supabase real-time
// for UI updates since the database changes are still happening in Supabase
```

### Step 7: Update Error Handling

#### Before (Edge Function Errors)
```typescript
// Old error handling
const handleProcessingError = (error: any) => {
  if (error.message?.includes('Edge function failed')) {
    showError('AI processing failed. Please try again.');
  } else {
    showError('An unexpected error occurred.');
  }
};
```

#### After (FastAPI Errors)
```typescript
// New error handling
const handleProcessingError = (error: any) => {
  if (error.status === 429) {
    showError('Rate limit exceeded. Please wait a moment.');
  } else if (error.status === 500) {
    showError('Server error. Please try again later.');
  } else if (error.status === 401) {
    showError('Authentication required. Please log in again.');
  } else {
    showError(error.message || 'An unexpected error occurred.');
  }
};
```

## 🔧 **Environment Configuration**

### Frontend Environment Variables

Add to your frontend `.env.local`:

```env
# FastAPI Backend URL
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Production URL (when deployed)
# VITE_API_BASE_URL=https://your-api-domain.com/api/v1
```

### Backend Environment Variables

Ensure your backend `.env` has all required variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Azure Computer Vision
AZURE_VISION_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
AZURE_VISION_KEY=your_azure_computer_vision_key

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your_secret_key_here
```

## 🧪 **Testing the Migration**

### 1. **Start Services**

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Celery Worker
cd backend
celery -A app.tasks.celery_app worker --loglevel=info

# Terminal 3: Start FastAPI Server
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 4: Start Frontend
cd ai-image-gallery
npm run dev
```

### 2. **Test Health Checks**

```bash
# Test basic health
curl http://localhost:8000/api/v1/health

# Test detailed health
curl http://localhost:8000/api/v1/health/detailed
```

### 3. **Test Image Upload**

1. Open your frontend application
2. Try uploading an image
3. Check the FastAPI logs for processing
4. Verify the image appears in the gallery

### 4. **Test AI Processing**

1. Upload an image
2. Check the Celery worker logs
3. Verify AI processing completes
4. Check the database for updated tags/description

## 🚨 **Common Migration Issues**

### 1. **CORS Issues**

If you encounter CORS errors, ensure your FastAPI backend allows your frontend origin:

```python
# In backend/app/config.py
allowed_origins = ["http://localhost:3000", "http://localhost:5173"]
```

### 2. **Authentication Issues**

Ensure you're passing the JWT token correctly:

```typescript
// Get fresh token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Use in API calls
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. **Processing Status Issues**

The FastAPI backend provides better status tracking. You can check processing status via:

```bash
# Check Celery worker status
celery -A app.tasks.celery_app inspect active

# Check specific task status
curl http://localhost:8000/api/v1/images/{image_id}
```

### 4. **Database Connection Issues**

Test your Supabase connection:

```bash
# Test from FastAPI
curl http://localhost:8000/api/v1/health/detailed
```

## 📊 **Performance Comparison**

### Edge Functions vs FastAPI

| Metric | Edge Functions | FastAPI |
|--------|----------------|---------|
| **Cold Start** | 2-5 seconds | < 100ms |
| **Processing Time** | Variable | Consistent |
| **Error Rate** | High (deployment issues) | Low |
| **Debugging** | Difficult | Easy |
| **Scalability** | Limited | Excellent |
| **Monitoring** | Basic | Comprehensive |

## 🎯 **Post-Migration Benefits**

### 1. **Reliability**
- ✅ No more stuck processing
- ✅ Automatic retry mechanisms
- ✅ Better error handling
- ✅ Consistent performance

### 2. **Development Experience**
- ✅ Easy local development
- ✅ Comprehensive logging
- ✅ Health check endpoints
- ✅ Interactive API docs

### 3. **Production Ready**
- ✅ Docker deployment
- ✅ Horizontal scaling
- ✅ Load balancing
- ✅ Monitoring and alerts

### 4. **Future Features**
- ✅ Easy to add new endpoints
- ✅ Background job processing
- ✅ Advanced search capabilities
- ✅ Analytics and metrics

## 🔄 **Rollback Plan**

If you need to rollback to Edge Functions:

1. **Keep Edge Functions code** in `ai-image-gallery/supabase/functions/`
2. **Revert frontend changes** to use Supabase functions
3. **Update environment variables** to remove FastAPI references
4. **Redeploy Edge Functions** using Supabase CLI

However, given the issues encountered with Edge Functions, the FastAPI solution provides a much more reliable and maintainable architecture.

---

**The migration to FastAPI solves all the issues encountered with Edge Functions while providing a robust, scalable foundation for future development.**
