# 🚀 Deployment Guide - Railway + Vercel (Easy Mode)

## ⚡ Why This Stack?

- **Railway (Backend)**: Auto-deploys, built-in monitoring, $5/month
- **Vercel (Frontend)**: Free, fast CDN, auto-deploys from GitHub
- **MongoDB Atlas**: Free 512MB, managed database
- **Upstash Redis**: Free 10k requests/day

**Total: $0-30/month until you have customers!**

---

## 🎯 Prerequisites

- [ ] GitHub account
- [ ] Railway account (sign up at railway.app)
- [ ] Vercel account (sign up at vercel.com)
- [ ] MongoDB Atlas account (atlas.mongodb.com)
- [ ] Upstash account (upstash.com)
- [ ] Your code pushed to GitHub

---

## Part 1: Setup Cloud Services (15 minutes)

### 1. MongoDB Atlas (5 mins)

```
1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up / Login
3. Click "Build a Database"
4. Choose "M0 Free" tier
5. Choose region: AWS / Mumbai (closest to Delhi)
6. Create cluster (takes 1-3 minutes)
7. Security:
   - Create database user (save username/password!)
   - Network Access → Add IP: 0.0.0.0/0 (allow all)
8. Click "Connect" → "Connect your application"
9. Copy connection string:
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/whatsapp_ai_bot
10. Save this for later!
```

### 2. Upstash Redis (3 mins)

```
1. Go to: https://upstash.com
2. Sign up / Login
3. Create Redis Database
   - Name: whatsapp-ai-redis
   - Region: Mumbai (ap-south-1)
   - Type: Free
4. Copy "Redis URL" from dashboard
   Example: rediss://default:xxxxx@endpoint.upstash.io:6379
5. Save this for later!
```

### 3. Get API Keys (7 mins)

**Twilio (WhatsApp):**
```
1. Go to: https://console.twilio.com
2. Sign up (free $15 credit)
3. Copy from dashboard:
   - Account SID: ACxxxxxxxxxxxxx
   - Auth Token: xxxxxxxxxxxxx
4. Go to: Messaging → Try it out → Send a WhatsApp message
5. Follow instructions to get sandbox number
   - WhatsApp Number: whatsapp:+14155238886
```

**OpenAI:**
```
1. Go to: https://platform.openai.com
2. Sign up / Login
3. Go to: API Keys
4. Create new secret key
5. Copy: sk-xxxxxxxxxxxxxxxxxxxxxxxx
6. Save immediately (won't show again!)
```

**JWT Secret (generate random string):**
```powershell
# In PowerShell:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
# Save the output!
```

---

## Part 2: Deploy Backend to Railway (10 minutes)

### Step 1: Push Code to GitHub

```bash
# In your project root
git init
git add .
git commit -m "Initial commit - WhatsApp AI Bot"

# Create new repo on GitHub, then:
git remote add origin https://github.com/yourusername/whatsapp-ai-bot.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Railway

```
1. Go to: https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Choose "Deploy from GitHub repo"
5. Select your repository
6. Railway will detect Node.js automatically!
7. Click "Add variables" to add environment:
```

**Add these environment variables in Railway:**

```env
# Server
NODE_ENV=production
PORT=5000

# Database (from MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/whatsapp_ai_bot

# Redis (from Upstash)
REDIS_URL=rediss://default:xxxxx@endpoint.upstash.io:6379

# JWT
JWT_SECRET=your-generated-random-32-character-string
JWT_EXPIRE=7d

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# Frontend URL (add after deploying frontend)
FRONTEND_URL=https://your-app.vercel.app
```

### Step 3: Configure Build

Railway should auto-detect, but verify:

```
Build Command: cd backend && npm install && npm run build
Start Command: cd backend && npm start
Root Directory: /
```

### Step 4: Deploy!

```
1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Railway will give you a URL: https://your-app.railway.app
4. Test: https://your-app.railway.app/health
   Should return: {"status":"OK",...}
```

---

## Part 3: Deploy Frontend to Vercel (5 minutes)

### Step 1: Update Frontend Config

**In `frontend/.env`:**
```env
VITE_API_URL=https://your-app.railway.app/api
```

Commit and push:
```bash
git add .
git commit -m "Update API URL for production"
git push
```

### Step 2: Deploy to Vercel

```
1. Go to: https://vercel.com
2. Sign up with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Framework Preset: Vite (auto-detected)
6. Root Directory: frontend
7. Build Command: npm run build
8. Output Directory: dist
9. Environment Variables:
   - VITE_API_URL: https://your-app.railway.app/api
10. Click "Deploy"
```

### Step 3: Get Your URL

```
1. Wait 1-2 minutes
2. Vercel gives you: https://your-app.vercel.app
3. Test in browser - should see login page!
```

### Step 4: Update Backend CORS

Go back to Railway:
```
1. Open your Railway project
2. Variables → Edit FRONTEND_URL
3. Set to: https://your-app.vercel.app
4. Save (auto-redeploys)
```

---

## Part 4: Setup Custom Domain (Optional - 10 mins)

### Backend Domain

**Railway:**
```
1. Go to Railway project → Settings
2. Under "Domains" → Generate Domain
3. Or add custom domain:
   - Add domain: api.yourdomain.com
   - Add CNAME record in your DNS: api → your-app.railway.app
```

### Frontend Domain

**Vercel:**
```
1. Go to Vercel project → Settings → Domains
2. Add domain: yourdomain.com
3. Follow instructions to add DNS records
4. Vercel handles SSL automatically!
```

---

## Part 5: Configure Twilio Webhook (5 mins)

Now that backend is live, update Twilio:

```
1. Go to Twilio Console
2. Messaging → Settings → WhatsApp Sandbox
3. Under "When a message comes in":
   - URL: https://your-app.railway.app/api/webhook/whatsapp
   - Method: HTTP POST
4. Save
```

**Test:**
1. Send WhatsApp message to sandbox number
2. Check Railway logs (should see incoming webhook)
3. AI should respond (once implemented)

---

## 🔄 Continuous Deployment

**Now every time you push to GitHub:**

✅ Railway auto-deploys backend
✅ Vercel auto-deploys frontend
✅ Zero manual work!

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push

# Wait 2-3 minutes
# Both sites update automatically!
```

---

## 📊 Monitoring & Logs

### Railway (Backend)

```
1. Go to Railway dashboard
2. Click your project
3. "Deployments" tab - see deploy history
4. "Logs" tab - real-time logs
5. "Metrics" tab - CPU, memory usage
```

### Vercel (Frontend)

```
1. Go to Vercel dashboard
2. Click your project
3. "Deployments" - see all deploys
4. "Analytics" - page views, performance
5. "Logs" - function logs
```

---

## 🐛 Debugging Production Issues

### Check Backend Health

```bash
curl https://your-app.railway.app/health
# Should return: {"status":"OK"}
```

### Check Logs

**Railway:**
```
1. Dashboard → Logs
2. Filter by error level
3. Download logs if needed
```

**Common Issues:**
- MongoDB connection: Check MONGODB_URI
- Redis connection: Check REDIS_URL
- API errors: Check logs for stack trace

---

## 💰 Cost Tracking

### Monitor Usage

**Railway:**
```
Dashboard → Usage
- See hours used
- Estimate monthly cost
- Set spending limit
```

**MongoDB Atlas:**
```
Dashboard → Metrics
- Storage used
- Connections
- Queries/sec
```

**Upstash:**
```
Dashboard → Usage
- Requests/day
- Data transfer
```

### Expected Costs (First Year)

**Month 1-3:** $0-5/month
- Railway: Free credits
- Everything else: Free tiers

**Month 4-6:** ~$30/month
- Railway: $10-15
- MongoDB: $9
- Upstash: $10

**Month 7-12:** ~$100/month
- Railway: $30-50
- MongoDB: $25-30
- Upstash: $10-20
- Vercel: $20 (if needed)

---

## 🔐 Security Checklist

Before going live:

- [ ] All API keys in environment variables (not in code)
- [ ] CORS configured (only your frontend domain)
- [ ] Rate limiting enabled
- [ ] MongoDB network access restricted (if possible)
- [ ] HTTPS everywhere (Railway/Vercel do this automatically)
- [ ] JWT secret is strong (32+ characters)
- [ ] Twilio webhook signature verification
- [ ] Input validation on all endpoints

---

## 🚀 Scaling Strategy

### 0-10 customers (Months 1-3)
- Keep free/cheap tier
- Monitor performance
- Optimize code

### 10-50 customers (Months 4-6)
- Upgrade Railway to $20/month
- Add MongoDB indexes
- Implement caching
- Monitor error rates

### 50-200 customers (Months 7-12)
- Consider Railway Pro
- Scale MongoDB (M10 tier)
- Add Redis caching aggressively
- Set up proper monitoring (Sentry)

### 200+ customers (Year 2)
- Evaluate Docker/Kubernetes
- Multi-region deployment
- Dedicated databases
- Consider hiring DevOps

---

## 📈 Performance Optimization

### Backend

```typescript
// Add to backend/src/server.ts

import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';

app.use(compression()); // Compress responses
app.use(mongoSanitize()); // Prevent NoSQL injection
```

### Database Indexing

```typescript
// In models/Chat.ts
chatSchema.index({ businessId: 1, customerPhone: 1 });
chatSchema.index({ businessId: 1, updatedAt: -1 });

// In models/Product.ts
productSchema.index({ businessId: 1, category: 1 });
productSchema.index({ name: 'text', description: 'text' });
```

### Caching

```typescript
// In services/product.service.ts
import redis from '../config/redis';

async getProducts(businessId: string) {
  const cacheKey = `products:${businessId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from DB
  const products = await Product.find({ businessId });
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(products));
  
  return products;
}
```

---

## 🔄 Backup Strategy

### MongoDB Atlas (Automatic)

```
1. Go to: Clusters → Backup
2. Free tier: Daily snapshots (retained 2 days)
3. Paid tier: Configure retention
```

### Manual Backup

```bash
# Backup MongoDB
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/whatsapp_ai_bot" --out=./backup

# Backup environment variables
# Keep a secure copy of all Railway/Vercel env vars
```

---

## 🆘 Troubleshooting

### Backend not deploying

```
Check Railway logs:
- Build errors? Fix package.json
- Start errors? Check start command
- Port issues? Railway uses $PORT env var
```

### Frontend not loading

```
Check Vercel logs:
- Build errors? Check vite.config.ts
- API errors? Verify VITE_API_URL
- CORS errors? Check backend FRONTEND_URL
```

### Database connection failed

```
- Check MONGODB_URI format
- Verify MongoDB Atlas IP whitelist (0.0.0.0/0)
- Test connection locally first
```

### WhatsApp webhook not working

```
- Verify webhook URL in Twilio
- Check Railway logs for incoming requests
- Ensure endpoint is POST, not GET
- Verify Twilio signature validation
```

---

## 📚 Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Upstash Docs**: https://docs.upstash.com
- **Twilio Webhooks**: https://www.twilio.com/docs/usage/webhooks

---

## ✅ Deployment Checklist

Before launch:

- [ ] Backend deployed on Railway
- [ ] Frontend deployed on Vercel
- [ ] MongoDB Atlas configured
- [ ] Upstash Redis configured
- [ ] All environment variables set
- [ ] Custom domain (optional)
- [ ] Twilio webhook configured
- [ ] Health check endpoint working
- [ ] Frontend connects to backend API
- [ ] CORS configured correctly
- [ ] Test WhatsApp message flow
- [ ] Error monitoring setup (Sentry)
- [ ] Backups configured

---

## 🎯 Quick Commands

```bash
# Check backend health
curl https://your-app.railway.app/health

# View Railway logs
railway logs

# Redeploy frontend
vercel --prod

# Check MongoDB connection
mongosh "mongodb+srv://cluster.mongodb.net" --username user

# Test Redis
redis-cli -u rediss://endpoint.upstash.io:6379 PING
```

---

**🚀 You're deployed! Focus on customers, not infrastructure!**
