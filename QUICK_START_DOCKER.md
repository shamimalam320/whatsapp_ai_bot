# Quick Start - Docker Commands

## 🚀 Local Development (Recommended)

Start everything with one command:
```powershell
docker-compose up
```

Access your app:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- MongoDB: localhost:27017
- Redis: localhost:6379

Stop everything:
```powershell
docker-compose down
```

## 🔨 Rebuild after code changes

```powershell
docker-compose up --build
```

## 🧹 Fresh start (removes all data)

```powershell
docker-compose down -v
docker-compose up --build
```

## 📊 View logs

```powershell
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just frontend  
docker-compose logs -f frontend
```

## 🐛 Troubleshooting

Container won't start?
```powershell
docker-compose logs backend
```

Port already in use?
```powershell
netstat -ano | findstr :5000
# Then kill the process or change port in docker-compose.yml
```

## 💡 What You Get

With Docker:
✅ Consistent environment (no "works on my machine")
✅ Easy to test locally
✅ One command to start everything
✅ Can deploy anywhere (Railway, AWS, DigitalOcean, etc.)
✅ MongoDB and Redis included for local dev

Databases:
✅ Local dev: MongoDB + Redis containers (free, automatic)
✅ Production: MongoDB Atlas + Upstash (managed, free tier)

## 📝 Next Steps

1. Test locally: `docker-compose up`
2. Build your features
3. When ready: Deploy to Railway (they support Docker!)
4. Railway uses your cloud databases (MongoDB Atlas + Upstash)

**Cost: $5-10/month on Railway with cloud databases**

No lock-in! You can move to any Docker host anytime.
