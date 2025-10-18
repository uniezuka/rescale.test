# Simple FastAPI Setup Guide

## 🎯 **Simplified FastAPI Backend**

This is a **much simpler** version of the FastAPI backend that removes all the complexity of Redis and Celery. It's just **FastAPI + Python** - easy to understand and deploy!

## 🚀 **What's Different (Simplified)**

### ❌ **Removed Complex Parts**
- ❌ Redis (message broker)
- ❌ Celery (background job queue)
- ❌ Complex deployment configurations
- ❌ Multiple services to manage

### ✅ **What You Get (Simple)**
- ✅ **Just FastAPI** - One Python application
- ✅ **Simple Background Processing** - Uses Python's built-in `asyncio`
- ✅ **Easy to Run** - Single command to start
- ✅ **Easy to Deploy** - Just one service
- ✅ **Easy to Understand** - Pure Python code

## 📁 **Simple Project Structure**

```
backend/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Simple configuration
│   ├── database.py             # Supabase connection
│   ├── auth.py                 # Authentication
│   ├── models/                 # Data models
│   ├── api/                    # API endpoints
│   ├── services/               # Business logic
│   │   ├── ai_processing.py    # Simple AI processing
│   │   ├── azure_vision.py     # Azure Computer Vision
│   │   ├── storage.py          # File storage
│   │   └── image_processing.py # Image processing
│   └── utils/                  # Utilities
├── requirements.txt            # Simple dependencies
├── Dockerfile                  # Simple Docker setup
└── docker-compose.yml         # One service only
```

## 🛠️ **Super Simple Setup**

### 1. **Install Dependencies**

```bash
cd backend
pip install -r requirements.txt
```

### 2. **Environment Configuration**

Create a `.env` file:

```env
# Supabase (required)
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Azure Computer Vision (required)
AZURE_VISION_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
AZURE_VISION_KEY=your_azure_computer_vision_key

# Optional settings (have defaults)
MAX_CONCURRENT_TASKS=5
LOG_LEVEL=INFO
```

### 3. **Start the Server**

```bash
# That's it! Just one command:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🎉 **You're Done!**

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health
- **API Base URL**: http://localhost:8000/api/v1

## 🐳 **Docker (Even Easier)**

```bash
# Build and run with Docker
docker-compose up -d

# That's it! No Redis, no Celery, just FastAPI
```

## 🔧 **How It Works (Simple)**

### **Image Upload Flow**
1. **User uploads image** → FastAPI receives it
2. **Save to Supabase Storage** → Store the file
3. **Save to Database** → Record the image info
4. **Start AI Processing** → Background task using Python's `asyncio`
5. **Azure Computer Vision** → Analyze the image
6. **Update Database** → Save AI results
7. **Done!** → User sees results

### **Background Processing (Simple)**
```python
# Instead of complex Celery, we use simple Python:
async def process_image_background(image_id, image_url):
    # Run in background using asyncio
    asyncio.create_task(process_image(image_id, image_url))
```

## 📊 **API Endpoints**

### **Images**
- `POST /api/v1/images/upload` - Upload image
- `GET /api/v1/images/` - List images
- `GET /api/v1/images/{id}` - Get image details
- `DELETE /api/v1/images/{id}` - Delete image
- `POST /api/v1/images/{id}/retry-processing` - Retry AI processing

### **Search**
- `GET /api/v1/search/images` - Search images
- `GET /api/v1/search/images/{id}/similar` - Find similar images

### **Health**
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed status

## 🔍 **Frontend Integration**

### **Environment Variables**
Add to your frontend `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### **API Calls Example**
```typescript
// Upload image
const formData = new FormData();
formData.append('file', file);

const response = await fetch(`${API_BASE_URL}/images/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData
});

// Get images
const response = await fetch(`${API_BASE_URL}/images/`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  }
});
```

## 🚀 **Deployment Options**

### **Option 1: Railway (Easiest)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### **Option 2: Render**
1. Connect GitHub repository
2. Select backend directory
3. Add environment variables
4. Deploy automatically

### **Option 3: DigitalOcean**
1. Create App Platform
2. Connect repository
3. Configure environment
4. Deploy

## 🔧 **Development**

### **Run Locally**
```bash
# Start the server
uvicorn app.main:app --reload

# Test the API
curl http://localhost:8000/api/v1/health
```

### **View Logs**
```bash
# All logs go to console - easy to see what's happening
# No separate Redis or Celery logs to manage
```

## 🎯 **Benefits of Simplified Version**

### **Easy to Understand**
- ✅ **One Service** - Just FastAPI, no complex orchestration
- ✅ **Pure Python** - No external dependencies like Redis
- ✅ **Simple Code** - Easy to read and modify
- ✅ **Clear Flow** - Straightforward request/response pattern

### **Easy to Deploy**
- ✅ **Single Container** - Just one Docker service
- ✅ **No Infrastructure** - No Redis to manage
- ✅ **Simple Scaling** - Just scale the FastAPI service
- ✅ **Easy Debugging** - All logs in one place

### **Easy to Maintain**
- ✅ **Fewer Dependencies** - Less things that can break
- ✅ **Simple Monitoring** - Just check FastAPI health
- ✅ **Easy Updates** - Update one service only
- ✅ **Clear Architecture** - Easy to understand and modify

## 🆚 **Complex vs Simple**

| Feature | Complex Version | Simple Version |
|---------|----------------|----------------|
| **Services** | FastAPI + Redis + Celery + Flower | Just FastAPI |
| **Dependencies** | Many (Redis, Celery, etc.) | Few (just FastAPI deps) |
| **Setup** | Complex (multiple services) | Simple (one command) |
| **Deployment** | Complex (multiple containers) | Simple (one container) |
| **Debugging** | Hard (multiple logs) | Easy (one log) |
| **Scaling** | Complex (scale multiple services) | Simple (scale one service) |
| **Learning Curve** | Steep | Gentle |

## 🎉 **Ready to Go!**

The simplified FastAPI backend is:
- ✅ **Much easier to understand**
- ✅ **Much easier to deploy**
- ✅ **Much easier to maintain**
- ✅ **Still has all the features you need**

Just run `uvicorn app.main:app --reload` and you're ready to go!

---

**This simplified version removes all the complexity while keeping all the functionality. Perfect for getting started quickly!**
