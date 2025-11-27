# AI Integration Setup Guide

## 🤖 AI-Powered Customer Service

Your WhatsApp bot now has intelligent AI responses powered by OpenAI!

## 🎯 Features Implemented

### 1. **Automatic AI Responses**
- Customers get instant AI-generated responses
- Multilingual support (English, Hindi, Hinglish)
- Context-aware conversations
- Product-aware responses

### 2. **Smart Intent Detection**
- Order placement detection
- Price inquiries
- Product search
- Support requests
- Delivery questions

### 3. **Product Integration**
- AI knows your product catalog
- Can recommend products
- Provides accurate pricing
- Answers product questions

### 4. **Development Mode**
- Works without OpenAI API key
- Rule-based smart responses
- Perfect for testing
- No costs during development

## 🚀 Quick Start

### Without OpenAI (Development Mode)

Your bot is **already working** in development mode! It uses smart rule-based responses:

1. Start your application:
   ```bash
   docker compose up --build
   ```

2. Test it:
   - Send a WhatsApp message (if Twilio configured)
   - OR use the AI test endpoint in your dashboard
   - Bot will respond intelligently based on keywords

**Development mode responses:**
- Greetings: "Hello! Welcome to [Business]..."
- Product inquiries: Lists your products
- Orders: Guides through ordering process
- Support: Offers help options
- All in English + Hindi!

### With OpenAI (Production Mode)

For production-quality AI responses:

#### Step 1: Get OpenAI API Key

1. Go to: https://platform.openai.com/signup
2. Create account (free trial: $5 credit)
3. Go to: https://platform.openai.com/api-keys
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-...`)

#### Step 2: Configure

Update `backend/.env`:

```env
# AI - OpenAI
OPENAI_API_KEY=sk-your-actual-api-key-here
```

#### Step 3: Choose Model

**Recommended models:**

- `gpt-4o-mini` - Fast, cheap, great quality (recommended)
  - Cost: ~$0.00015 per 1K tokens
  - Perfect for customer service

- `gpt-4o` - Best quality
  - Cost: ~$0.005 per 1K tokens
  - Use for complex conversations

- `gpt-3.5-turbo` - Budget option
  - Cost: ~$0.0005 per 1K tokens
  - Good for simple queries

Default is `gpt-4o-mini` - excellent balance!

#### Step 4: Rebuild and Test

```bash
docker compose down
docker compose up --build
```

## 🧪 Testing Your AI

### Option 1: Via WhatsApp

1. Configure Twilio (see WHATSAPP_SETUP.md)
2. Send a message to your WhatsApp number
3. AI responds automatically!

### Option 2: Via API (Testing)

Test AI without WhatsApp:

```bash
# Login first to get token
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what products do you have?"}'
```

### Option 3: Via Dashboard (Coming Soon)

We can add an AI test page to your dashboard!

## 📊 AI Configuration

You can customize AI behavior per business:

### Via API:

```bash
curl -X PUT http://localhost:5000/api/ai/config \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "systemPrompt": "Custom instructions for your bot..."
  }'
```

### Configuration Options:

- **model**: AI model to use (gpt-4o-mini, gpt-4o, gpt-3.5-turbo)
- **temperature**: Creativity (0.0 - 1.0)
  - 0.0 = Very predictable, formal
  - 0.7 = Balanced (recommended)
  - 1.0 = Creative, varied
- **systemPrompt**: Custom instructions for AI behavior

## 🌍 Multilingual Support

The AI automatically detects and responds in the customer's language:

**Customer writes in English:**
> "What's the price of your calculator?"

**AI responds in English:**
> "Our Calculator is priced at ₹500. Would you like to order it?"

**Customer writes in Hindi:**
> "कैलकुलेटर की कीमत क्या है?"

**AI responds in Hindi:**
> "हमारा Calculator ₹500 में उपलब्ध है। क्या आप इसे ऑर्डर करना चाहेंगे?"

**Customer writes in Hinglish:**
> "Calculator kitne ka hai?"

**AI responds in Hinglish:**
> "Calculator ₹500 ka hai. Order karein?"

## 🔍 How It Works

```
Customer Message
      ↓
Twilio Webhook
      ↓
Message Queue (Bull + Redis)
      ↓
AI Service
  - Load business context
  - Load products
  - Detect intent
  - Generate response
      ↓
Send via WhatsApp
      ↓
Save to database
```

## 💡 AI Capabilities

### What AI Can Do:

✅ Answer product questions  
✅ Provide pricing information  
✅ Help place orders  
✅ Handle support queries  
✅ Recommend products  
✅ Explain delivery details  
✅ Handle complaints professionally  
✅ Switch between English/Hindi/Hinglish  
✅ Remember conversation context  
✅ Detect customer intent  

### What AI Won't Do:

❌ Share products you don't have  
❌ Make up prices  
❌ Promise what you can't deliver  
❌ Access external systems (payment, etc.)  

## 💰 Cost Estimation

### Development Mode (Free):
- Rule-based responses
- No OpenAI costs
- Perfect for testing

### Production Mode:

**Using gpt-4o-mini (recommended):**
- Average message: ~200 tokens
- Cost per message: ~$0.00003
- 1000 messages: ~$0.03
- 10,000 messages: ~$0.30

**Example monthly costs:**
- 100 customers, 5 messages each = 500 messages = ~$0.015
- 1000 customers, 10 messages each = 10K messages = ~$0.30
- 10,000 customers, 5 messages each = 50K messages = ~$1.50

**Very affordable!** Most businesses spend < $5/month.

## 🎛️ Optimization Tips

### 1. Use Development Mode Initially
Test everything without costs first

### 2. Start with gpt-4o-mini
Best quality-to-price ratio

### 3. Limit Chat History
Currently using last 10 messages - perfect balance

### 4. Cache Common Responses
For FAQs, you can add static responses

### 5. Monitor Usage
Check OpenAI dashboard regularly

## 🐛 Troubleshooting

### "AI not responding"
- Check if OpenAI API key is set
- Verify key is valid at platform.openai.com
- Check backend logs for errors
- Development mode should still work

### "Responses in wrong language"
- AI detects language automatically
- May need more context in first message
- Check your product names (English + Hindi)

### "Generic responses"
- Add more products to your catalog
- Customize system prompt
- Increase temperature for more variety

### "Slow responses"
- Normal: AI takes 2-5 seconds
- gpt-4o-mini is fastest
- Redis queue prevents timeout issues

## 🔐 Security Notes

- API keys are kept secret in backend
- Never expose OpenAI key to frontend
- Twilio signature validation protects webhook
- Rate limiting on API endpoints

## 🎉 Next Steps

Now that AI is working:

1. **Test thoroughly** - Try different queries
2. **Train your team** - Show them AI capabilities
3. **Add products** - More products = smarter AI
4. **Configure Twilio** - Connect real WhatsApp
5. **Monitor conversations** - Use Chats dashboard
6. **Build order flow** - Next phase!

## 🚀 Advanced: Custom AI Behaviors

You can customize AI for your specific business:

### Example: E-commerce Store
```javascript
{
  "systemPrompt": "You are a sales assistant for an electronics store. Focus on helping customers find the right product based on their needs. Always suggest complementary products. Be enthusiastic about technology!"
}
```

### Example: Restaurant
```javascript
{
  "systemPrompt": "You are a friendly restaurant assistant. Help customers with menu items, dietary restrictions, delivery times, and reservations. Always be warm and welcoming. Suggest popular dishes."
}
```

### Example: Service Business
```javascript
{
  "systemPrompt": "You are a professional service coordinator. Help customers book appointments, understand services, and answer questions about pricing and availability. Be professional and efficient."
}
```

## 📞 Support

Having issues? Check:
- Backend logs: `docker compose logs backend`
- Redis logs: `docker compose logs redis`
- OpenAI usage: https://platform.openai.com/usage

---

**Status**: AI Integration Complete ✅  
**Mode**: Development (works now) + Production (with OpenAI) ✅  
**Next**: Order Processing System 🛒
