# FastAPI Backend Deployment Guide

## 🚀 **Deployment Options**

This guide covers multiple deployment options for the FastAPI backend, from local development to production cloud deployments.

## 📋 **Prerequisites**

Before deploying, ensure you have:
- ✅ FastAPI backend code
- ✅ Environment variables configured
- ✅ Supabase project setup
- ✅ Azure Computer Vision API key
- ✅ Redis instance (for production)

## 🐳 **Option 1: Docker Deployment (Recommended)**

### Local Docker Development

```bash
# Clone and navigate to backend
cd backend

# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Compose Services

The `docker-compose.yml` includes:
- **API**: FastAPI application
- **Celery**: Background worker
- **Flower**: Celery monitoring dashboard
- **Redis**: Message broker and cache

### Access Points
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Flower Dashboard**: http://localhost:5555
- **Health Check**: http://localhost:8000/api/v1/health

### Scaling Workers

```bash
# Scale Celery workers
docker-compose up --scale celery=3

# Scale API instances
docker-compose up --scale api=2
```

## ☁️ **Option 2: Cloud Deployment**

### Railway Deployment

Railway provides easy deployment with automatic scaling:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Set environment variables
railway variables set SUPABASE_URL=your_supabase_url
railway variables set AZURE_VISION_ENDPOINT=your_azure_endpoint
railway variables set AZURE_VISION_KEY=your_azure_key
railway variables set REDIS_URL=your_redis_url

# Deploy
railway up
```

### Render Deployment

1. **Connect Repository**
   - Link your GitHub repository
   - Select the backend directory

2. **Configure Service**
   ```yaml
   # render.yaml
   services:
     - type: web
       name: ai-image-gallery-api
       env: python
       buildCommand: pip install -r requirements.txt
       startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
       envVars:
         - key: SUPABASE_URL
           value: your_supabase_url
         - key: AZURE_VISION_ENDPOINT
           value: your_azure_endpoint
         - key: AZURE_VISION_KEY
           value: your_azure_key
         - key: REDIS_URL
           value: your_redis_url
   ```

3. **Deploy**
   - Render automatically deploys on git push
   - Monitor deployment in dashboard

### DigitalOcean App Platform

1. **Create App**
   - Choose "Container Registry"
   - Connect GitHub repository

2. **Configure Components**
   ```yaml
   # .do/app.yaml
   name: ai-image-gallery
   services:
     - name: api
       source_dir: backend
       github:
         repo: your-username/ai-image-gallery
         branch: main
       run_command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
       environment_slug: python
       instance_count: 2
       instance_size_slug: basic-xxs
       envs:
         - key: SUPABASE_URL
           value: ${SUPABASE_URL}
         - key: AZURE_VISION_ENDPOINT
           value: ${AZURE_VISION_ENDPOINT}
         - key: AZURE_VISION_KEY
           value: ${AZURE_VISION_KEY}
         - key: REDIS_URL
           value: ${REDIS_URL}
   ```

3. **Add Redis Database**
   - Create managed Redis database
   - Configure connection string

### AWS Deployment

#### Using Elastic Beanstalk

1. **Prepare Application**
   ```bash
   # Create deployment package
   cd backend
   zip -r ../deployment.zip . -x "*.git*" "*.env*" "venv/*"
   ```

2. **Create EB Application**
   ```bash
   # Install EB CLI
   pip install awsebcli
   
   # Initialize
   eb init
   
   # Create environment
   eb create production
   
   # Set environment variables
   eb setenv SUPABASE_URL=your_supabase_url
   eb setenv AZURE_VISION_ENDPOINT=your_azure_endpoint
   eb setenv AZURE_VISION_KEY=your_azure_key
   eb setenv REDIS_URL=your_redis_url
   ```

3. **Deploy**
   ```bash
   eb deploy
   ```

#### Using ECS with Fargate

1. **Create Docker Image**
   ```bash
   # Build and tag
   docker build -t ai-image-gallery-backend .
   docker tag ai-image-gallery-backend:latest your-account.dkr.ecr.region.amazonaws.com/ai-image-gallery:latest
   
   # Push to ECR
   docker push your-account.dkr.ecr.region.amazonaws.com/ai-image-gallery:latest
   ```

2. **Create Task Definition**
   ```json
   {
     "family": "ai-image-gallery",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "512",
     "memory": "1024",
     "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "api",
         "image": "your-account.dkr.ecr.region.amazonaws.com/ai-image-gallery:latest",
         "portMappings": [
           {
             "containerPort": 8000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {"name": "SUPABASE_URL", "value": "your_supabase_url"},
           {"name": "AZURE_VISION_ENDPOINT", "value": "your_azure_endpoint"},
           {"name": "AZURE_VISION_KEY", "value": "your_azure_key"},
           {"name": "REDIS_URL", "value": "your_redis_url"}
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/ai-image-gallery",
             "awslogs-region": "us-west-2",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

3. **Create Service**
   - Use the task definition
   - Configure load balancer
   - Set up auto-scaling

## 🔧 **Option 3: Manual Server Deployment**

### VPS Deployment (Ubuntu/Debian)

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Python 3.11
   sudo apt install python3.11 python3.11-venv python3.11-dev -y
   
   # Install Redis
   sudo apt install redis-server -y
   sudo systemctl enable redis-server
   sudo systemctl start redis-server
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Application Setup**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/ai-image-gallery.git
   cd ai-image-gallery/backend
   
   # Create virtual environment
   python3.11 -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Configure environment
   cp .env.example .env
   nano .env  # Edit with your values
   ```

3. **Create Systemd Services**

   **API Service** (`/etc/systemd/system/ai-image-gallery-api.service`):
   ```ini
   [Unit]
   Description=AI Image Gallery API
   After=network.target redis.service

   [Service]
   Type=exec
   User=www-data
   Group=www-data
   WorkingDirectory=/path/to/ai-image-gallery/backend
   Environment=PATH=/path/to/ai-image-gallery/backend/venv/bin
   ExecStart=/path/to/ai-image-gallery/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   Restart=always
   RestartSec=3

   [Install]
   WantedBy=multi-user.target
   ```

   **Celery Service** (`/etc/systemd/system/ai-image-gallery-celery.service`):
   ```ini
   [Unit]
   Description=AI Image Gallery Celery Worker
   After=network.target redis.service

   [Service]
   Type=exec
   User=www-data
   Group=www-data
   WorkingDirectory=/path/to/ai-image-gallery/backend
   Environment=PATH=/path/to/ai-image-gallery/backend/venv/bin
   ExecStart=/path/to/ai-image-gallery/backend/venv/bin/celery -A app.tasks.celery_app worker --loglevel=info
   Restart=always
   RestartSec=3

   [Install]
   WantedBy=multi-user.target
   ```

4. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/ai-image-gallery
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /flower {
           proxy_pass http://127.0.0.1:5555;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

5. **Start Services**
   ```bash
   # Enable and start services
   sudo systemctl enable ai-image-gallery-api
   sudo systemctl enable ai-image-gallery-celery
   sudo systemctl start ai-image-gallery-api
   sudo systemctl start ai-image-gallery-celery
   
   # Enable Nginx site
   sudo ln -s /etc/nginx/sites-available/ai-image-gallery /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## 🔒 **SSL/TLS Configuration**

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 **Monitoring & Logging**

### Application Monitoring

1. **Health Checks**
   ```bash
   # Basic health check
   curl http://your-domain.com/api/v1/health
   
   # Detailed health check
   curl http://your-domain.com/api/v1/health/detailed
   ```

2. **Log Monitoring**
   ```bash
   # View API logs
   sudo journalctl -u ai-image-gallery-api -f
   
   # View Celery logs
   sudo journalctl -u ai-image-gallery-celery -f
   
   # View Nginx logs
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Celery Monitoring**
   ```bash
   # Start Flower
   celery -A app.tasks.celery_app flower --port=5555
   
   # Access at http://your-domain.com:5555
   ```

### Performance Monitoring

1. **System Resources**
   ```bash
   # CPU and memory usage
   htop
   
   # Disk usage
   df -h
   
   # Network connections
   netstat -tulpn
   ```

2. **Application Metrics**
   - FastAPI built-in metrics
   - Custom business metrics
   - Database query performance

## 🔄 **CI/CD Pipeline**

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy FastAPI Backend

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        cd backend
        pytest
    
    - name: Build Docker image
      run: |
        cd backend
        docker build -t ai-image-gallery-backend:${{ github.sha }} .
    
    - name: Deploy to production
      run: |
        # Your deployment commands here
        # e.g., update Kubernetes deployment
        # or push to container registry
```

## 🚨 **Troubleshooting**

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check service status
   sudo systemctl status ai-image-gallery-api
   
   # Check logs
   sudo journalctl -u ai-image-gallery-api --no-pager
   ```

2. **Redis Connection Issues**
   ```bash
   # Check Redis status
   sudo systemctl status redis-server
   
   # Test connection
   redis-cli ping
   ```

3. **Port Already in Use**
   ```bash
   # Find process using port
   sudo lsof -i :8000
   
   # Kill process
   sudo kill -9 PID
   ```

4. **Permission Issues**
   ```bash
   # Fix ownership
   sudo chown -R www-data:www-data /path/to/ai-image-gallery
   
   # Fix permissions
   sudo chmod -R 755 /path/to/ai-image-gallery
   ```

## 📈 **Scaling Considerations**

### Horizontal Scaling

1. **Load Balancer Configuration**
   ```nginx
   upstream api_backend {
       server 127.0.0.1:8000;
       server 127.0.0.1:8001;
       server 127.0.0.1:8002;
   }
   
   server {
       location / {
           proxy_pass http://api_backend;
       }
   }
   ```

2. **Multiple Celery Workers**
   ```bash
   # Scale workers
   sudo systemctl start ai-image-gallery-celery@1
   sudo systemctl start ai-image-gallery-celery@2
   sudo systemctl start ai-image-gallery-celery@3
   ```

### Database Scaling

1. **Connection Pooling**
   - Configure Supabase connection limits
   - Use connection pooling for high traffic

2. **Read Replicas**
   - Use Supabase read replicas for search queries
   - Implement read/write splitting

## 🔐 **Security Best Practices**

### Production Security

1. **Environment Variables**
   - Never commit `.env` files
   - Use secure secret management
   - Rotate keys regularly

2. **Network Security**
   - Use HTTPS only
   - Configure firewall rules
   - Restrict database access

3. **Application Security**
   - Regular dependency updates
   - Security headers
   - Rate limiting
   - Input validation

## 📞 **Support & Maintenance**

### Regular Maintenance

1. **Updates**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update Python dependencies
   pip install -r requirements.txt --upgrade
   
   # Restart services
   sudo systemctl restart ai-image-gallery-api
   sudo systemctl restart ai-image-gallery-celery
   ```

2. **Backup**
   ```bash
   # Backup application code
   tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/ai-image-gallery
   
   # Backup configuration
   sudo cp -r /etc/systemd/system/ai-image-gallery* /backup/
   ```

3. **Monitoring**
   - Set up alerts for service failures
   - Monitor resource usage
   - Track application performance

---

**This deployment guide provides comprehensive options for deploying the FastAPI backend from development to production, ensuring reliability and scalability for the AI Image Gallery application.**
