# Fix WhatsApp Business Number

## Problem
Your webhook is working but showing: `No business found for WhatsApp number: +14155238886`

This means your Business record needs to be updated with the WhatsApp number.

## Solution

### Option 1: Using MongoDB Compass (Easiest)

1. **Install MongoDB Compass**: https://www.mongodb.com/try/download/compass

2. **Connect to your database**:
   ```
   mongodb+srv://whatsappbot:shamim9795@cluster0.mjyt52w.mongodb.net/whatsapp_ai_bot
   ```

3. **Find your business**:
   - Database: `whatsapp_ai_bot`
   - Collection: `businesses`
   - You should see your business record

4. **Edit the business document**:
   - Click on the document
   - Add or update field: `whatsappNumber`
   - Value: `whatsapp:+14155238886`
   - Click "Update"

5. **Verify**: The document should now have:
   ```json
   {
     "_id": "...",
     "name": "CBM Creative Box Maker",
     "whatsappNumber": "whatsapp:+14155238886",
     ...
   }
   ```

### Option 2: Using MongoDB Shell

1. **Connect to MongoDB**:
   ```bash
   mongosh "mongodb+srv://whatsappbot:shamim9795@cluster0.mjyt52w.mongodb.net/whatsapp_ai_bot"
   ```

2. **Update business**:
   ```javascript
   db.businesses.updateOne(
     {},
     { $set: { whatsappNumber: "whatsapp:+14155238886" } }
   )
   ```

3. **Verify**:
   ```javascript
   db.businesses.findOne()
   ```

### Option 3: Quick Web Update (Online MongoDB Shell)

1. Go to: https://cloud.mongodb.com/
2. Login with your MongoDB Atlas account
3. Navigate to your cluster
4. Click "Collections"
5. Select database: `whatsapp_ai_bot`
6. Select collection: `businesses`
7. Click "Edit" on your business document
8. Add/update field: `whatsappNumber` = `whatsapp:+14155238886`
9. Click "Update"

## After Update

1. **Send a WhatsApp message** to `+14155238886`

2. **Check logs** - you should see:
   ```
   ✅ Received WhatsApp message: { from: 'whatsapp:+91...', body: 'Hello', ... }
   New chat created for +91...
   Message queued for processing: SM...
   ```

3. **Check your dashboard**: http://localhost:5173
   - Go to "Chats"
   - You should see the new conversation!

4. **Bot will auto-reply** within 2-5 seconds with AI response

## Quick Test

After updating, send this WhatsApp message:
```
Hello
```

You should get an AI reply like:
```
Hello! 👋 Welcome to CBM Creative Box Maker! 
How can I help you today?
```

## Current Status

✅ Backend running
✅ MongoDB connected  
✅ ngrok tunnel active
✅ Twilio webhook configured
✅ Webhook receiving messages
❌ Business WhatsApp number not set (fix with steps above)

## ⚠️ Important

The WhatsApp number **MUST** include the `whatsapp:` prefix:
- ✅ Correct: `whatsapp:+14155238886`
- ❌ Wrong: `+14155238886`
- ❌ Wrong: `14155238886`
