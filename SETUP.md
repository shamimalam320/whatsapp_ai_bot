# 🚀 Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+**: [Download](https://nodejs.org/)
- **MongoDB**: [Download](https://www.mongodb.com/try/download/community) OR use MongoDB Atlas (Free Cloud)
- **Redis**: [Download](https://redis.io/download) OR use Upstash (Free Cloud)
- **Git**: [Download](https://git-scm.com/downloads)
- **VS Code**: [Download](https://code.visualstudio.com/) (Recommended)

## Step-by-Step Setup

### 1. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env file and add your credentials
# - MongoDB URI (local or Atlas)
# - JWT secret
# - Twilio credentials
# - OpenAI API key
```

**Edit `.env` file:**
```env
PORT=5000
NODE_ENV=development

# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/whatsapp_ai_bot
# OR MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp_ai_bot

REDIS_URL=redis://localhost:6379

JWT_SECRET=your-super-secret-key-min-32-characters-long

# Get from Twilio Console: https://console.twilio.com/
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Get from OpenAI: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx

FRONTEND_URL=http://localhost:5173
```

### 2. Frontend Setup

```bash
# Navigate to frontend folder
cd ../frontend

# Install dependencies
npm install

# Environment is already set in .env file
# VITE_API_URL=http://localhost:5000/api
```

### 3. Database Setup

#### Option A: Local MongoDB

```bash
# Install MongoDB Community Edition
# Windows: Download installer from mongodb.com
# Mac: brew install mongodb-community
# Linux: Follow official docs

# Start MongoDB service
# Windows: MongoDB starts automatically
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Verify MongoDB is running
# Open MongoDB Compass or use CLI
mongosh
```

#### Option B: MongoDB Atlas (Recommended for beginners)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create new cluster (Free M0 tier)
4. Click "Connect" → "Connect your application"
5. Copy connection string
6. Replace `<password>` with your database password
7. Paste into `MONGODB_URI` in `.env`

Example:
```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/whatsapp_ai_bot
```

### 4. Redis Setup

#### Option A: Local Redis

```bash
# Windows: Download from https://redis.io/download
# Or use WSL: sudo apt install redis-server

# Mac
brew install redis
brew services start redis

# Linux
sudo apt install redis-server
sudo systemctl start redis
```

#### Option B: Upstash Redis (Free Cloud)

1. Go to [Upstash](https://upstash.com/)
2. Create account
3. Create Redis database
4. Copy Redis URL
5. Paste into `REDIS_URL` in `.env`

### 5. Get API Keys

#### Twilio (WhatsApp)

1. Go to [Twilio Console](https://console.twilio.com/)
2. Create account (Free trial: $15 credit)
3. Get WhatsApp Sandbox number:
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to connect your phone
4. Copy credentials:
   - Account SID
   - Auth Token
   - WhatsApp Sandbox number

#### OpenAI

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create account
3. Go to API Keys section
4. Create new API key
5. Copy and save (you won't see it again!)

**Note**: OpenAI charges per use. ~$0.01 per conversation.

### 6. Run the Application

#### Terminal 1: Start Backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

#### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:5173/
```

### 7. Access the Application

Open your browser: [http://localhost:5173](http://localhost:5173)

You should see the login page!

## 🧪 Testing the Setup

### Test Backend Health

```bash
# In PowerShell or browser
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-22T...",
  "uptime": 10.5
}
```

### Test Frontend

1. Open http://localhost:5173
2. You should see "WhatsApp AI Bot" login page
3. Try entering email and password (won't work yet - auth not implemented)

### Test WhatsApp (After Twilio Setup)

1. Connect your phone to Twilio Sandbox:
   - Send WhatsApp message to Twilio number
   - Use join code from Twilio console
2. Send any message
3. Webhook should receive it (check backend logs)

## 📁 Project Structure Overview

```
whatsapp_ai_bot/
├── backend/              # Node.js Express API
│   ├── src/
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── server.ts    # Entry point
│   └── package.json
│
├── frontend/            # React dashboard
│   ├── src/
│   │   ├── pages/       # Page components
│   │   └── App.tsx      # Main app
│   └── package.json
│
└── README.md           # Main documentation
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Frontend port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### MongoDB Connection Failed

- Check MongoDB is running: `mongosh`
- Verify URI in `.env` file
- For Atlas: Check network access (whitelist 0.0.0.0/0)

### Redis Connection Failed

- Check Redis is running: `redis-cli ping`
- Should return: `PONG`

### Module Not Found Errors

```bash
# Delete node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

These are expected at this stage! The error messages you see are because:
- Dependencies aren't installed yet
- This is the initial project structure

Run `npm install` in both folders to fix.

## 🎯 Next Steps

After successful setup:

1. **Implement Authentication** (Week 1)
   - Register/Login endpoints
   - JWT token generation
   - Protected routes

2. **Build Product Catalog** (Week 1-2)
   - CRUD operations
   - Image upload
   - Search functionality

3. **WhatsApp Integration** (Week 2-3)
   - Webhook handler
   - Message sending
   - Message queue

4. **AI Integration** (Week 3-4)
   - OpenAI integration
   - Language detection
   - Prompt engineering

5. **Frontend UI** (Week 4-5)
   - Dashboard with real data
   - Chat interface
   - Product management

## 📚 Learning Resources

- **Node.js**: https://nodejs.dev/learn
- **React**: https://react.dev/learn
- **MongoDB**: https://university.mongodb.com
- **Twilio WhatsApp**: https://www.twilio.com/docs/whatsapp
- **OpenAI**: https://platform.openai.com/docs

## 💡 Tips

1. **Start Small**: Get basic features working first
2. **Use GitHub Copilot**: Great for boilerplate code
3. **Test Often**: Test each feature as you build it
4. **Read Logs**: Backend logs will help debug issues
5. **Use Postman**: Test API endpoints before building UI

## 🆘 Need Help?

- Check the main README.md for architecture details
- Review error logs in `backend/logs/`
- Test API endpoints with Postman
- Use GitHub Copilot for code suggestions

---

**You're all set! Start building your WhatsApp AI Bot SaaS! 🚀**
