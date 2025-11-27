# Installation Commands

## Quick Start Commands

Copy and run these commands in your terminal (PowerShell):

### 1. Backend Setup

```powershell
# Navigate to project directory
cd c:\Users\ShamimAlam\Desktop\whatsapp_ai_bot

# Setup backend
cd backend

# Install dependencies
npm install

# Copy environment file
Copy-Item .env.example .env

# Create logs directory
New-Item -ItemType Directory -Force -Path logs
```

### 2. Frontend Setup

```powershell
# Go back to root and enter frontend
cd c:\Users\ShamimAlam\Desktop\whatsapp_ai_bot\frontend

# Install dependencies
npm install
```

### 3. Install MongoDB (Choose one)

#### Option A: MongoDB Community (Local)

Download and install: https://www.mongodb.com/try/download/community

Or use Chocolatey:
```powershell
choco install mongodb
```

#### Option B: MongoDB Atlas (Cloud - Recommended)

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update backend/.env

### 4. Install Redis (Choose one)

#### Option A: Redis on Windows (via WSL)

```powershell
# Install WSL first
wsl --install

# Then in WSL:
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

#### Option B: Upstash Redis (Cloud - Recommended)

1. Sign up at https://upstash.com
2. Create Redis database
3. Copy Redis URL
4. Update backend/.env

### 5. Start Development Servers

#### Terminal 1 - Backend
```powershell
cd c:\Users\ShamimAlam\Desktop\whatsapp_ai_bot\backend
npm run dev
```

#### Terminal 2 - Frontend
```powershell
cd c:\Users\ShamimAlam\Desktop\whatsapp_ai_bot\frontend
npm run dev
```

## Complete Installation Script

Run this entire script in PowerShell (as Administrator):

```powershell
# Set execution policy (if needed)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Navigate to project
cd c:\Users\ShamimAlam\Desktop\whatsapp_ai_bot

# Backend setup
Write-Host "Setting up backend..." -ForegroundColor Green
cd backend
npm install
if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✓ Created .env file - Please edit with your credentials" -ForegroundColor Yellow
}
New-Item -ItemType Directory -Force -Path logs | Out-Null
Write-Host "✓ Backend setup complete" -ForegroundColor Green

# Frontend setup
Write-Host "`nSetting up frontend..." -ForegroundColor Green
cd ../frontend
npm install
Write-Host "✓ Frontend setup complete" -ForegroundColor Green

Write-Host "`n✅ Installation complete!" -ForegroundColor Green
Write-Host "`n⚠️  Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit backend/.env with your credentials"
Write-Host "2. Start MongoDB and Redis"
Write-Host "3. Run 'npm run dev' in backend folder"
Write-Host "4. Run 'npm run dev' in frontend folder"
Write-Host "`nFor detailed setup, see SETUP.md"
```

## Verification Commands

Check if everything is installed correctly:

```powershell
# Check Node.js
node --version
# Should show v18+ or v20+

# Check npm
npm --version
# Should show 9+ or 10+

# Check MongoDB (if local)
mongosh --version

# Check Redis (if local via WSL)
wsl redis-cli ping
# Should return: PONG

# Check backend dependencies
cd backend
npm list --depth=0

# Check frontend dependencies
cd ../frontend
npm list --depth=0
```

## Troubleshooting Commands

### Clear and Reinstall

```powershell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm cache clean --force
npm install

# Frontend
cd ../frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm cache clean --force
npm install
```

### Kill Ports

```powershell
# Kill backend port (5000)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Kill frontend port (5173)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
```

### Check Logs

```powershell
# Backend logs
cd backend
Get-Content logs/combined.log -Tail 50

# Real-time backend logs
Get-Content logs/combined.log -Wait

# Frontend console
# Check browser console (F12)
```

## GitHub Copilot Setup Commands

After installation, you can use these prompts with GitHub Copilot:

```
"Install and setup ESLint for the backend"
"Add Prettier configuration for code formatting"
"Setup Jest for testing in backend"
"Add React Testing Library to frontend"
"Configure Husky for pre-commit hooks"
```

## Environment Variables Template

Create `backend/.env` with these values:

```env
# Server
PORT=5000
NODE_ENV=development

# Database - Choose one:
# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/whatsapp_ai_bot
# OR Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp_ai_bot

# Redis - Choose one:
# Local Redis:
REDIS_URL=redis://localhost:6379
# OR Upstash:
# REDIS_URL=rediss://default:password@endpoint.upstash.io:6379

# JWT (Generate random string)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-change-me
JWT_EXPIRE=7d

# Twilio WhatsApp (Get from https://console.twilio.com/)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OpenAI (Get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Pinecone for vector search
# PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# PINECONE_ENVIRONMENT=us-east-1
# PINECONE_INDEX_NAME=products

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Next Steps

After installation:

1. **Get API Keys**:
   - Twilio: https://console.twilio.com/
   - OpenAI: https://platform.openai.com/api-keys
   - MongoDB Atlas: https://www.mongodb.com/cloud/atlas
   - Upstash Redis: https://upstash.com/

2. **Update .env file** with your credentials

3. **Start development**:
   ```powershell
   # Terminal 1
   cd backend; npm run dev
   
   # Terminal 2 (new terminal)
   cd frontend; npm run dev
   ```

4. **Test the app**:
   - Backend health: http://localhost:5000/health
   - Frontend: http://localhost:5173

5. **Start building features** following the ROADMAP.md

---

**All set! Happy coding! 🚀**
