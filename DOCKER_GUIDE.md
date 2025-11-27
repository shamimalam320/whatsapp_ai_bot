# 🐳 Docker Deployment Guide

## Overview

This project is fully containerized with Docker, giving you flexibility to deploy anywhere:
- **Local Development**: Docker Compose with local MongoDB/Redis
- **Production**: Railway/Cloud with MongoDB Atlas/Upstash Redis
- **Self-Hosted**: Any VPS with Docker support

---

## 🚀 Quick Start

### Prerequisites
- Docker installed: https://docs.docker.com/get-docker/
- Docker Compose installed (usually included with Docker Desktop)

### Local Development (Easiest)

```bash
# Start all services (backend, frontend, MongoDB, Redis)
docker-compose up

# Access:
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
# MongoDB: localhost:27017
# Redis: localhost:6379
```

**Rebuild after code changes:**
```bash
docker-compose up --build
```

**Stop all services:**
```bash
docker-compose down
```

**Remove volumes (fresh start):**
```bash
docker-compose down -v
```

---

## 📋 Docker Files Explained

### Backend Dockerfile (`backend/Dockerfile`)
- Uses Node 20 Alpine (lightweight)
- Builds TypeScript to JavaScript
- Production dependencies only
- Health check included
- Optimized for Railway deployment

### Frontend Dockerfile (`frontend/Dockerfile`)
- Multi-stage build (smaller image)
- Stage 1: Build React app
- Stage 2: Serve with Nginx
- Includes caching and security headers
- Production-ready

### docker-compose.yml (Development)
- Local MongoDB container (data persists in volume)
- Local Redis container
- Hot-reload enabled for development
- Port mappings for direct access

### docker-compose.prod.yml (Production)
- No local databases (uses cloud services)
- Environment variables from .env file
- Logging configured
- Restart policies for high availability

---

## 🌐 Deployment Options

### Option 1: Railway (Recommended - Easiest)

Railway supports Docker natively and is perfect for your use case.

**Steps:**

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize project:**
   ```bash
   railway init
   ```

4. **Deploy backend:**
   ```bash
   cd backend
   railway up
   ```

5. **Deploy frontend:**
   ```bash
   cd ../frontend
   railway up
   ```

6. **Set environment variables in Railway dashboard:**
   - `MONGODB_URI` (your MongoDB Atlas connection string)
   - `REDIS_URL` (your Upstash Redis URL)
   - `JWT_SECRET`
   - `TWILIO_*` (when ready)
   - `OPENAI_API_KEY` (when ready)

**Cost:** $5-10/month

---

### Option 2: DigitalOcean/Hetzner VPS (Self-Hosted)

For full control with Docker Compose.

**Steps:**

1. **Create VPS:**
   - DigitalOcean: $12/month (2GB RAM)
   - Hetzner: €4.5/month (2GB RAM) - Cheapest!

2. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **Clone your repo:**
   ```bash
   git clone https://github.com/yourusername/whatsapp_ai_bot.git
   cd whatsapp_ai_bot
   ```

4. **Create .env file:**
   ```bash
   cp backend/.env.example backend/.env
   nano backend/.env  # Add your values
   ```

5. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

6. **Setup Nginx reverse proxy (optional but recommended):**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

**Cost:** $4-12/month for VPS + your time

---

### Option 3: AWS ECS / Google Cloud Run

For enterprise-grade deployments (overkill for MVP, but option for later).

**AWS ECS Fargate:**
- Upload Docker images to ECR
- Create ECS task definitions
- Deploy to Fargate (serverless containers)
- **Cost:** ~$30-50/month minimum

**Google Cloud Run:**
- Push images to Container Registry
- Deploy to Cloud Run (auto-scaling)
- **Cost:** Pay per request, ~$10-30/month

---

## 🔧 Building & Testing Locally

### Build backend image:
```bash
cd backend
docker build -t whatsapp-backend .
```

### Build frontend image:
```bash
cd frontend
docker build -t whatsapp-frontend .
```

### Test backend locally:
```bash
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/whatsapp_ai_bot \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e JWT_SECRET=test-secret \
  whatsapp-backend
```

### Test frontend locally:
```bash
docker run -p 8080:80 whatsapp-frontend
```

---

## 📊 Database Strategy

### Development (docker-compose.yml)
- **MongoDB**: Local container
- **Redis**: Local container
- Data persists in Docker volumes
- Fast, no internet needed

### Production (docker-compose.prod.yml)
- **MongoDB**: MongoDB Atlas (cloud, managed)
  - Free tier: 512MB
  - Automatic backups
  - High availability
- **Redis**: Upstash Redis (cloud, managed)
  - Free tier: 10k requests/day
  - Serverless scaling

**Why cloud databases in production?**
- ✅ Automatic backups
- ✅ High availability (99.9% uptime)
- ✅ Easy scaling
- ✅ No maintenance burden
- ✅ Professional disaster recovery
- ✅ Free tiers sufficient for months

---

## 🎯 Recommended Workflow

### Phase 1: Development (Now)
```bash
# Use Docker Compose for local development
docker-compose up

# All services run locally
# Hot-reload enabled
# Fast iteration
```

### Phase 2: MVP Deployment (Week 10)
```bash
# Deploy to Railway
railway up

# Uses cloud databases (MongoDB Atlas + Upstash)
# Railway builds and runs your Dockerfiles
# Auto-scaling enabled
# Cost: $5-10/month
```

### Phase 3: Scale (100+ customers)
```bash
# Move to VPS if needed
# Deploy with docker-compose.prod.yml
# Keep cloud databases
# Cost: $15-25/month (VPS + DB scaling)
```

### Phase 4: Enterprise (1000+ customers)
```bash
# Kubernetes or AWS ECS
# Horizontal scaling
# Multiple regions
# Load balancers
# Cost: $100-500/month
```

---

## 🔥 Pro Tips

1. **Use multi-stage builds** (already done in frontend Dockerfile)
   - Smaller images
   - Faster deployments
   - Better security

2. **Health checks are crucial** (already added)
   - Railway/Docker know when app is ready
   - Auto-restart on failures

3. **Don't copy node_modules**
   - Use .dockerignore (already created)
   - Install fresh in container
   - Avoids platform issues

4. **Layer caching**
   - Copy package.json first
   - Then source code
   - Faster rebuilds

5. **Environment variables**
   - Never hardcode secrets
   - Use .env files
   - Different configs for dev/prod

---

## 🆘 Troubleshooting

### Port already in use:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different ports in docker-compose.yml
```

### Container won't start:
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild without cache
docker-compose build --no-cache
docker-compose up
```

### MongoDB connection failed:
```bash
# Check if MongoDB container is running
docker ps

# Check MongoDB logs
docker logs whatsapp_bot_mongodb

# Try connection
docker exec -it whatsapp_bot_mongodb mongosh
```

### Frontend can't reach backend:
- Check VITE_API_URL in frontend/.env
- Should be http://localhost:5000 for local dev
- Should be your Railway backend URL for production

---

## 📈 Monitoring & Logs

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Resource usage:
```bash
docker stats
```

### Clean up:
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

---

## ✅ Next Steps

1. **Test locally:**
   ```bash
   docker-compose up
   ```

2. **Verify all services work**

3. **When ready to deploy:**
   - Sign up for Railway
   - Connect your GitHub repo
   - Railway auto-detects Dockerfiles
   - Deploy both backend and frontend

4. **Add production environment variables in Railway dashboard**

5. **Monitor and iterate!**

---

## 💰 Cost Summary

### Local Development
- **Cost:** $0 (runs on your machine)

### Railway + Cloud DBs (Recommended for MVP)
- Railway: $5-10/month
- MongoDB Atlas: Free → $9/month (when you outgrow free tier)
- Upstash Redis: Free → $0.2 per 100k requests
- **Total: $5-20/month**

### Self-Hosted VPS + Cloud DBs
- Hetzner VPS: €4.5/month (~$5)
- DigitalOcean: $12/month
- MongoDB Atlas: Free → $9/month
- Upstash Redis: Free
- **Total: $5-25/month + your DevOps time**

---

**You now have a production-ready Docker setup! 🎉**

Deploy anywhere, anytime. You're not locked into any platform.
