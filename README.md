# 🚀 WhatsApp AI Automation SaaS Platform

## 📋 Project Overview

A complete SaaS platform for businesses to automate WhatsApp customer interactions with AI, supporting Hindi, English, and Hinglish. Target market: Delhi-based SMEs needing multilingual support.

### Core Features
- ✅ Auto-reply with AI (multilingual: Hindi, English, Hinglish)
- 📦 Product catalog management
- 💰 Offers, pricing, and quotations
- 📅 Appointment/order booking
- 🔔 Follow-up reminders
- 📞 AI voice call auto-answer
- 📊 Analytics & lead management dashboard
- 🎯 **Delhi Advantage**: Most competitors only support English

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Customer (WhatsApp)          Seller (Web Dashboard)        │
│       └─> Messages                 └─> React SPA            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY / BACKEND                    │
│                    (Node.js + Express)                       │
├─────────────────────────────────────────────────────────────┤
│  • Authentication (JWT)                                      │
│  • Rate Limiting                                             │
│  • Request Routing                                           │
│  • WebSocket Server (real-time updates)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│  WhatsApp API    │ │   AI Layer   │ │  Database    │
│  Integration     │ │              │ │  (MongoDB)   │
├──────────────────┤ ├──────────────┤ ├──────────────┤
│ • Twilio/        │ │ • OpenAI/    │ │ • Users      │
│   360Dialog      │ │   Gemini     │ │ • Businesses │
│ • Message Queue  │ │ • LangChain  │ │ • Products   │
│ • Webhooks       │ │ • RAG        │ │ • Orders     │
└──────────────────┘ └──────────────┘ │ • Chats      │
                                       │ • Analytics  │
                                       └──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKGROUND SERVICES                       │
├─────────────────────────────────────────────────────────────┤
│  • Scheduled Reminders (Node-cron)                          │
│  • Voice Call Handler (Twilio)                              │
│  • Analytics Processor                                       │
│  • Report Generator                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend (API Server)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Atlas)
- **Cache**: Redis
- **Queue**: Bull (Redis-based job queue)
- **Authentication**: JWT + bcrypt
- **Validation**: Zod

### Frontend (Seller Dashboard)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI Library**: Shadcn/ui + Tailwind CSS
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

### WhatsApp Integration
- **Primary**: Twilio WhatsApp API
- **Alternative**: 360Dialog / WhatsApp Business Cloud API
- **Message Queue**: Bull Queue for webhook handling

### AI Layer
- **LLM**: OpenAI GPT-4 or Google Gemini Pro
- **Framework**: LangChain.js
- **Vector Store**: Pinecone (for product catalog RAG)
- **Language Detection**: franc or custom model
- **Voice**: Twilio Voice API + Speech-to-Text

### DevOps & Hosting
- **Backend Hosting**: Railway / Render / DigitalOcean
- **Frontend Hosting**: Vercel / Netlify
- **Database**: MongoDB Atlas (Free tier available)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry

---

## 📁 Project Structure

```
whatsapp_ai_bot/
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   │   ├── database.ts
│   │   │   ├── whatsapp.ts
│   │   │   └── ai.ts
│   │   ├── models/            # MongoDB schemas
│   │   │   ├── User.ts
│   │   │   ├── Business.ts
│   │   │   ├── Product.ts
│   │   │   ├── Order.ts
│   │   │   ├── Chat.ts
│   │   │   └── Lead.ts
│   │   ├── controllers/       # Route controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── business.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── whatsapp.controller.ts
│   │   │   └── analytics.controller.ts
│   │   ├── services/          # Business logic
│   │   │   ├── whatsapp.service.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── voice.service.ts
│   │   │   └── reminder.service.ts
│   │   ├── routes/            # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── business.routes.ts
│   │   │   ├── webhook.routes.ts
│   │   │   └── analytics.routes.ts
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   ├── utils/             # Helper functions
│   │   │   ├── logger.ts
│   │   │   └── errorHandler.ts
│   │   ├── jobs/              # Background jobs
│   │   │   ├── reminderJob.ts
│   │   │   └── analyticsJob.ts
│   │   └── server.ts          # Entry point
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                   # React dashboard
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   └── ChatList.tsx
│   │   │   ├── products/
│   │   │   │   ├── ProductForm.tsx
│   │   │   │   └── ProductList.tsx
│   │   │   └── analytics/
│   │   │       └── Charts.tsx
│   │   ├── pages/             # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── Chats.tsx
│   │   │   └── Analytics.tsx
│   │   ├── store/             # State management
│   │   │   ├── authStore.ts
│   │   │   └── businessStore.ts
│   │   ├── services/          # API calls
│   │   │   └── api.ts
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── docs/                       # Documentation
│   ├── API.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
└── README.md
```

---

## 🎯 How It Works

### For Customers (WhatsApp Users)
1. Customer sends a message to your WhatsApp Business number
2. AI detects language (Hindi/English/Hinglish)
3. AI processes the message and responds based on:
   - Product catalog queries
   - Pricing information
   - Order placement
   - Appointment booking
4. All conversations are logged in the database
5. Follow-up reminders are automatically sent

### For Sellers (Business Owners)
1. **Dashboard Access**: Login to web dashboard
2. **Setup**:
   - Connect WhatsApp Business number
   - Upload product catalog
   - Configure AI responses
   - Set business hours
3. **Management**:
   - View all customer chats in real-time
   - Manage products and pricing
   - Track orders and appointments
   - View analytics and reports
4. **Customization**:
   - Train AI with custom responses
   - Set up automated workflows
   - Configure reminder schedules

---

## 🚀 Getting Started

### Prerequisites
```bash
# Required software
- Node.js 18+ 
- MongoDB (local or Atlas account)
- Redis (local or cloud)
- Git
- Code editor (VS Code recommended)
```

### Installation Commands

```bash
# 1. Clone or navigate to project directory
cd c:\Users\ShamimAlam\Desktop\whatsapp_ai_bot

# 2. Initialize backend
mkdir backend
cd backend
npm init -y
npm install express typescript ts-node @types/node @types/express
npm install mongoose dotenv cors helmet express-rate-limit
npm install jsonwebtoken bcryptjs @types/jsonwebtoken @types/bcryptjs
npm install twilio openai langchain @langchain/openai
npm install bull ioredis node-cron
npm install zod express-validator
npm install winston
npm install --save-dev @types/cors @types/node-cron nodemon

# 3. Initialize frontend
cd ..
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom zustand axios
npm install @radix-ui/react-icons @radix-ui/react-slot
npm install tailwindcss postcss autoprefixer
npm install recharts react-hook-form @hookform/resolvers
npm install clsx tailwind-merge lucide-react

# 4. Setup Tailwind CSS
npx tailwindcss init -p
```

### Environment Variables

**backend/.env**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/whatsapp_ai_bot
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# AI
OPENAI_API_KEY=your_openai_api_key
# OR
GOOGLE_AI_API_KEY=your_gemini_api_key

# Pinecone (for product search)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_environment

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📊 Database Schema

### Collections

#### 1. users
```typescript
{
  _id: ObjectId,
  email: string,
  password: string, // hashed
  name: string,
  phone: string,
  role: 'admin' | 'seller',
  businessId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. businesses
```typescript
{
  _id: ObjectId,
  name: string,
  whatsappNumber: string,
  industry: string,
  languages: ['hindi', 'english', 'hinglish'],
  businessHours: {
    start: string, // "09:00"
    end: string    // "21:00"
  },
  aiConfig: {
    model: string,
    temperature: number,
    systemPrompt: string
  },
  subscription: {
    plan: 'free' | 'basic' | 'pro',
    expiresAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. products
```typescript
{
  _id: ObjectId,
  businessId: ObjectId,
  name: string,
  nameHindi: string,
  description: string,
  descriptionHindi: string,
  price: number,
  category: string,
  images: string[],
  inStock: boolean,
  variants: Array<{
    name: string,
    price: number
  }>,
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. chats
```typescript
{
  _id: ObjectId,
  businessId: ObjectId,
  customerPhone: string,
  customerName: string,
  messages: Array<{
    role: 'customer' | 'bot' | 'agent',
    content: string,
    language: string,
    timestamp: Date
  }>,
  status: 'active' | 'closed',
  leadScore: number,
  tags: string[],
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. orders
```typescript
{
  _id: ObjectId,
  businessId: ObjectId,
  chatId: ObjectId,
  customerPhone: string,
  items: Array<{
    productId: ObjectId,
    quantity: number,
    price: number
  }>,
  totalAmount: number,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  deliveryAddress: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. appointments
```typescript
{
  _id: ObjectId,
  businessId: ObjectId,
  customerPhone: string,
  customerName: string,
  appointmentDate: Date,
  service: string,
  status: 'scheduled' | 'completed' | 'cancelled',
  reminderSent: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new seller
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Business
- `GET /api/business/profile` - Get business profile
- `PUT /api/business/profile` - Update business profile
- `POST /api/business/whatsapp/connect` - Connect WhatsApp

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Chats
- `GET /api/chats` - List all chats
- `GET /api/chats/:id` - Get chat details
- `POST /api/chats/:id/reply` - Send manual reply

### Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

### Analytics
- `GET /api/analytics/overview` - Dashboard stats
- `GET /api/analytics/chats` - Chat analytics
- `GET /api/analytics/sales` - Sales analytics

### Webhooks
- `POST /api/webhook/whatsapp` - WhatsApp incoming messages
- `POST /api/webhook/voice` - Voice call handler

---

## 🤖 AI Implementation

### Message Processing Flow
```typescript
1. Receive WhatsApp message → Webhook
2. Detect language (Hindi/English/Hinglish)
3. Load business context (products, previous chats)
4. Generate AI response using:
   - Product catalog (RAG with Pinecone)
   - Order history
   - Business-specific prompts
5. Send response via WhatsApp API
6. Log conversation to database
```

### Multilingual Support
```typescript
// Language detection
import franc from 'franc';

const detectLanguage = (text: string) => {
  const lang = franc(text);
  if (lang === 'hin') return 'hindi';
  if (lang === 'eng') return 'english';
  // Mixed = Hinglish
  return 'hinglish';
};

// AI Prompt Template
const systemPrompt = `
You are a helpful sales assistant for {businessName}.
Respond in {language}.
Products available: {productList}
Customer previous orders: {orderHistory}

Guidelines:
- Be friendly and helpful
- Answer questions about products
- Help with ordering process
- Book appointments when asked
`;
```

---

## 🎨 Key Features to Build

### Phase 1: MVP (Weeks 1-3)
- [ ] Backend API setup
- [ ] MongoDB database models
- [ ] WhatsApp webhook integration
- [ ] Basic AI response (English only)
- [ ] Seller authentication
- [ ] Product catalog CRUD
- [ ] Simple dashboard

### Phase 2: Core Features (Weeks 4-6)
- [ ] Multilingual AI (Hindi, Hinglish)
- [ ] Order booking system
- [ ] Appointment scheduling
- [ ] Follow-up reminders
- [ ] Chat management UI
- [ ] Real-time updates (WebSocket)

### Phase 3: Advanced (Weeks 7-9)
- [ ] Voice call integration
- [ ] Analytics dashboard
- [ ] Lead scoring
- [ ] Custom AI training
- [ ] Bulk messaging
- [ ] Payment integration

### Phase 4: Polish & Deploy (Week 10)
- [ ] Testing
- [ ] Performance optimization
- [ ] Deployment
- [ ] Documentation

---

## 💡 Development Approach

### Should You Use AI Tools?

**YES - Use GitHub Copilot for:**
- Boilerplate code generation
- API route creation
- Database schema
- Type definitions
- UI components
- Test cases

**Build Yourself:**
- Core AI logic
- WhatsApp integration
- Business logic
- Security implementation
- Payment handling

### Recommended Workflow
1. **Use GitHub Copilot Chat**: "Generate Express route for product CRUD"
2. **Review & Customize**: Don't blindly accept suggestions
3. **Test Each Module**: Build incrementally
4. **Iterate**: Start simple, add features gradually

---

## 🚀 Deployment

### Backend (Railway.app)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel
```

### Database (MongoDB Atlas)
1. Create free cluster at mongodb.com/cloud/atlas
2. Whitelist IP: 0.0.0.0/0 (allow all)
3. Copy connection string to .env

---

## 💰 Cost Estimation (Monthly)

### Free Tier Setup
- MongoDB Atlas: Free (512MB)
- Redis: Upstash Free (10k requests)
- Railway: $5/month (or free with limits)
- Vercel: Free
- Twilio WhatsApp: Pay-as-you-go (₹0.40/msg)
- OpenAI API: Pay-as-you-go (~₹1/conversation)

**Total**: ~₹2000-5000/month for first 100 customers

---

## 📚 Learning Resources

- **WhatsApp API**: https://developers.facebook.com/docs/whatsapp
- **Twilio**: https://www.twilio.com/docs/whatsapp
- **LangChain**: https://js.langchain.com/docs
- **MongoDB**: https://university.mongodb.com
- **React**: https://react.dev

---

## 🎯 Delhi Market Advantage

- Most competitors: English-only bots
- Your USP: Hindi + Hinglish support
- Target: Local Delhi SMEs (kirana stores, salons, clinics)
- Pricing: ₹999-2999/month vs competitors' ₹5000+

---

## 📞 Next Steps

1. **Setup Development Environment** (Day 1)
   - Install Node.js, MongoDB, Redis
   - Setup code editor

2. **Backend Foundation** (Days 2-5)
   - Initialize Express server
   - Connect MongoDB
   - Create basic API structure

3. **WhatsApp Integration** (Days 6-8)
   - Setup Twilio account
   - Test webhook receiving
   - Test message sending

4. **AI Integration** (Days 9-12)
   - Setup OpenAI/Gemini
   - Build prompt templates
   - Test multilingual responses

5. **Frontend Dashboard** (Days 13-18)
   - Build React app
   - Create authentication
   - Build product management

6. **Testing & Polish** (Days 19-21)
   - End-to-end testing
   - Bug fixes
   - Deploy MVP

---

## 🤝 Support

For issues or questions:
- GitHub Issues: [Create Issue]
- Email: your-email@example.com

---

**Built with ❤️ for Delhi businesses**
