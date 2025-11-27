# 🤖 GitHub Copilot Prompts Guide

This file contains specific prompts to use with GitHub Copilot to accelerate development of your WhatsApp AI Bot SaaS.

## 📚 How to Use This Guide

1. Open the file you want to work on in VS Code
2. Press `Ctrl+I` (Windows) or `Cmd+I` (Mac) to open Copilot Chat
3. Copy and paste the prompt from this guide
4. Review the generated code carefully
5. Modify as needed for your use case

---

## 🔐 Authentication & Authorization

### User Registration
```
Create a POST endpoint in Express at /api/auth/register that:
1. Accepts email, password, name, phone, businessName, industry
2. Validates email format and password strength (min 6 chars)
3. Checks if user already exists
4. Hashes password with bcryptjs
5. Creates both User and Business documents in MongoDB
6. Returns JWT token with 7 day expiry
7. Returns user and business data (without password)
8. Handles all errors with appropriate status codes
```

### Login
```
Create a POST endpoint at /api/auth/login that:
1. Accepts email and password
2. Finds user by email (include password field)
3. Compares password using bcrypt
4. Generates JWT token
5. Returns token and user data
6. Handles invalid credentials with 401 status
```

### Auth Middleware
```
Create Express middleware for JWT authentication that:
1. Extracts token from Authorization header (Bearer token)
2. Verifies JWT token
3. Finds user by ID from token
4. Attaches user to request object
5. Handles expired tokens and invalid tokens
6. Returns 401 for unauthorized requests
```

---

## 📦 Product Management

### Product CRUD
```
Create Express routes for product management:
1. GET /api/products - List all products for authenticated user's business
   - Add pagination (page, limit)
   - Add search by name
   - Add filter by category
   - Sort by createdAt descending
2. POST /api/products - Create new product
   - Validate required fields: name, price, category
   - Support Hindi translations
   - Handle image URLs array
3. PUT /api/products/:id - Update product
   - Verify product belongs to user's business
4. DELETE /api/products/:id - Soft delete product
   - Set inStock to false instead of deleting
```

### Product Search with Text Index
```
Add full-text search to Product model in MongoDB:
1. Create text index on name and description fields
2. Create GET endpoint at /api/products/search?q=query
3. Use MongoDB $text operator for search
4. Return matching products with score
5. Support search in both English and Hindi
```

---

## 💬 WhatsApp Integration

### Webhook Handler
```
Create POST endpoint at /api/webhook/whatsapp for Twilio webhooks:
1. Verify Twilio signature for security
2. Extract: From (phone), Body (message), MessageSid
3. Find or create Chat document
4. Add message to chat.messages array
5. Queue message for AI processing using Bull
6. Return 200 status immediately (webhook requirement)
7. Log all webhook data
```

### Send WhatsApp Message
```
Create a service function to send WhatsApp message using Twilio:
1. Accept: to (phone number), message (text), businessId
2. Load business Twilio credentials
3. Use Twilio API to send message
4. Handle media URLs for images
5. Save sent message to Chat document
6. Handle rate limits and errors
7. Return message SID
```

### Message Queue Worker
```
Create Bull queue worker to process WhatsApp messages:
1. Setup Bull queue connected to Redis
2. Create job processor that:
   - Receives message data
   - Detects language (Hindi/English/Hinglish)
   - Generates AI response
   - Sends response via Twilio
   - Updates chat document
3. Handle job failures with retry (max 3 attempts)
4. Log all processing steps
```

---

## 🤖 AI Integration

### OpenAI Chat Service
```
Create an AI service using OpenAI that:
1. Takes input: customerMessage, conversationHistory, productCatalog, businessInfo
2. Detects language using franc library
3. Builds system prompt with:
   - Business context
   - Product information
   - Language instruction
   - Conversation guidelines
4. Calls OpenAI GPT-4 API
5. Returns AI response
6. Handles errors and fallbacks
7. Logs token usage
```

### Language Detection
```
Create a language detection utility that:
1. Takes input text
2. Uses franc library to detect language
3. Returns 'hindi', 'english', or 'hinglish'
4. Hinglish = mixed Hindi-English (check for both scripts)
5. Fallback to 'english' if uncertain
6. Handle short messages (< 10 chars)
```

### Multilingual Prompt Templates
```
Create prompt template system that:
1. Defines base prompts for: greeting, product_inquiry, order, appointment
2. Each prompt in 3 languages: English, Hindi, Hinglish
3. Function to get prompt by type and language
4. Include variables for: {businessName}, {products}, {customerName}
5. Store in separate config file
```

---

## 📊 Order Management

### Create Order from Chat
```
Create POST endpoint /api/orders to create order:
1. Extract from request: chatId, items array, deliveryAddress
2. Verify chat belongs to user's business
3. Validate product IDs and calculate total
4. Create Order document
5. Update chat with order reference
6. Send confirmation message to customer
7. Return order details
```

### Order Status Update
```
Create PUT endpoint /api/orders/:id/status:
1. Accept status: pending, confirmed, completed, cancelled
2. Verify order belongs to user's business
3. Update order status
4. Send WhatsApp notification to customer
5. Add status change to order history
6. Return updated order
```

---

## 📅 Appointment Booking

### Extract Date/Time from Message
```
Create utility function to extract date and time from text:
1. Use regex or natural language processing
2. Handle formats: "tomorrow 3pm", "next Monday", "25th December"
3. Convert to JavaScript Date object
4. Handle timezone (Asia/Kolkata)
5. Return null if no date found
6. Support Hindi date terms (kal, agle hafte, etc.)
```

### Book Appointment
```
Create POST endpoint /api/appointments:
1. Accept: chatId, customerName, appointmentDate, service
2. Verify business availability
3. Check for conflicts (same time slot)
4. Create Appointment document
5. Send confirmation to customer
6. Schedule reminder for 1 day before
7. Return appointment details
```

---

## 🔔 Reminder System

### Setup Reminder Cron Jobs
```
Create reminder system using node-cron:
1. Setup cron job that runs every hour
2. Query appointments for next 24 hours where reminderSent = false
3. For each appointment:
   - Send WhatsApp reminder
   - Update reminderSent to true
4. Setup order follow-up cron (3 days after order)
5. Log all reminder activity
```

### Follow-up Messages
```
Create follow-up message templates:
1. Order placed confirmation
2. Order shipped notification
3. Delivery confirmation
4. Review request (3 days after delivery)
5. Appointment reminder (1 day before)
6. All templates in English, Hindi, Hinglish
7. Include business name and details
```

---

## 📈 Analytics

### Dashboard Stats
```
Create GET endpoint /api/analytics/overview:
1. Return aggregate stats:
   - Total chats (today, this week, this month)
   - Active chats (status = 'active')
   - Total orders (by status)
   - Total revenue
   - Average response time
   - Customer satisfaction score
2. Filter by date range
3. Cache results in Redis (5 min TTL)
```

### Chat Analytics
```
Create GET endpoint /api/analytics/chats:
1. Return time-series data for charts:
   - Messages per day (last 30 days)
   - Chats by language
   - Response rate
   - Busiest hours
2. Group by businessId
3. Format for Recharts consumption
```

---

## 🎨 Frontend Components

### Login Form with React Hook Form
```
Create React login component using react-hook-form and Zod:
1. Form fields: email, password
2. Zod schema for validation
3. Submit to /api/auth/login
4. Store JWT token in localStorage
5. Redirect to dashboard on success
6. Show error messages
7. Loading state during submission
8. Style with Tailwind CSS
```

### Product Table with Pagination
```
Create React component for product list:
1. Fetch products from /api/products
2. Display in table with columns: Image, Name, Category, Price, Stock, Actions
3. Implement pagination (10 items per page)
4. Add search input (debounced)
5. Add filter dropdown for category
6. Edit and Delete buttons
7. Use loading skeleton while fetching
8. Style with Tailwind CSS
```

### Chat Interface
```
Create real-time chat interface component:
1. List of chats in sidebar (sorted by recent)
2. Selected chat shows message thread
3. Each message shows: sender, content, timestamp
4. Auto-scroll to latest message
5. Manual reply input at bottom
6. Send button triggers POST to /api/chats/:id/reply
7. Update in real-time using WebSocket or polling
8. Show customer info panel
```

### Analytics Charts
```
Create analytics dashboard with Recharts:
1. Line chart for messages over time
2. Bar chart for orders by status
3. Pie chart for language distribution
4. Stats cards for KPIs
5. Date range selector
6. Fetch data from /api/analytics endpoints
7. Responsive layout with grid
8. Export to CSV button
```

---

## 🧪 Testing

### API Endpoint Tests with Jest
```
Create Jest tests for authentication endpoints:
1. Test POST /api/auth/register
   - Valid registration
   - Duplicate email
   - Invalid email format
   - Weak password
2. Test POST /api/auth/login
   - Valid login
   - Invalid credentials
   - Missing fields
3. Use supertest for HTTP requests
4. Mock MongoDB with mongodb-memory-server
5. Setup and teardown test database
```

### React Component Tests
```
Create tests for Login component using React Testing Library:
1. Render test
2. Test email input validation
3. Test password input
4. Test form submission
5. Test error message display
6. Mock axios API calls
7. Test navigation on success
```

---

## 🚀 Deployment

### Railway Deployment Config
```
Create deployment configuration for Railway:
1. Create railway.json with build and start commands
2. Setup environment variables in Railway dashboard
3. Create Procfile
4. Configure MongoDB Atlas connection
5. Setup Redis with Upstash
6. Add health check endpoint
7. Configure custom domain
```

### GitHub Actions CI/CD
```
Create GitHub Actions workflow for automated deployment:
1. Trigger on push to main branch
2. Run tests (npm test)
3. Build backend (npm run build)
4. Deploy backend to Railway
5. Build frontend (npm run build)
6. Deploy frontend to Vercel
7. Send notification on success/failure
```

---

## 💡 Advanced Features

### RAG with Pinecone
```
Create product search using RAG:
1. Setup Pinecone vector database
2. Embed product descriptions using OpenAI embeddings
3. Index all products in Pinecone
4. When customer asks about product:
   - Embed their query
   - Search Pinecone for similar products
   - Pass results to OpenAI as context
5. Return AI response with product recommendations
```

### Voice Call Handler
```
Create Twilio Voice webhook handler:
1. Receive incoming call webhook
2. Use TwiML to respond
3. Play welcome message
4. Use <Gather> for speech input
5. Convert speech to text
6. Process with AI
7. Convert AI response to speech
8. Handle call flow (menu, transfers)
```

---

## 🔍 Debugging Prompts

### Add Logging
```
Add comprehensive logging to WhatsApp webhook handler:
1. Log incoming request body
2. Log extracted message data
3. Log AI processing steps
4. Log response sent
5. Use winston logger with different levels
6. Include timestamps and request IDs
```

### Error Handling
```
Improve error handling in Express app:
1. Create custom error classes
2. Add try-catch to all async routes
3. Global error handler middleware
4. Log errors with stack traces
5. Return appropriate status codes
6. Hide sensitive data in production
7. Send errors to Sentry
```

---

## ✅ Best Practices

When using these prompts:

1. **Review Generated Code**: Always review and test
2. **Adapt to Context**: Modify for your specific needs
3. **Security First**: Validate inputs, sanitize outputs
4. **Error Handling**: Add proper error handling
5. **Testing**: Write tests for critical features
6. **Performance**: Add caching and optimization
7. **Documentation**: Comment complex logic

---

## 🎯 Quick Commands

Use these shorter prompts for quick tasks:

```
"Add input validation for email field"
"Create loading spinner component"
"Add error boundary to React app"
"Implement rate limiting middleware"
"Add MongoDB connection retry logic"
"Create API documentation with JSDoc"
"Add TypeScript types for User model"
"Implement file upload with multer"
"Create custom React hook for auth"
"Add dark mode toggle"
```

---

**Happy coding with GitHub Copilot! 🚀**
