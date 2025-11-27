# 🎨 Template & Workflow System for WhatsApp AI Bot

## 📋 Overview

This document explains how to build a **category-specific template system** so sellers from different industries (doctors, shopkeepers, cloth sellers, restaurants, etc.) can quickly set up AI-powered WhatsApp automation tailored to their business needs.

---

## 🎯 The Problem We're Solving

**Current State:**
- Every seller (doctor, cloth seller, restaurant) gets the same generic chatbot
- They have to manually configure everything
- No industry-specific features out-of-the-box
- Hard to customize without coding

**Desired State:**
- Seller selects "Clinic" template → Gets appointment booking, prescription reminders, doctor availability
- Seller selects "Cloth Shop" template → Gets catalog browsing, size/color options, bulk order flow
- Seller selects "Restaurant" template → Gets menu ordering, table booking, delivery tracking
- Each template includes pre-configured workflows, messages, and automation rules

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SELLER ONBOARDING                     │
├─────────────────────────────────────────────────────────┤
│ 1. Register → Choose Industry Category                  │
│    - Doctor/Clinic                                       │
│    - Retail Shop (Clothes, Electronics, etc.)          │
│    - Restaurant/Cafe                                     │
│    - Salon/Spa                                           │
│    - Real Estate                                         │
│    - Education/Coaching                                  │
│                                                          │
│ 2. System loads category-specific template:             │
│    - Product/service schema                              │
│    - Message templates (Hindi + English)                │
│    - Workflow automations                                │
│    - AI prompts                                          │
│    - Quick replies                                       │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  TEMPLATE COMPONENTS                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 📦 DATA SCHEMA                                           │
│    - Product/Service fields                              │
│    - Custom attributes                                   │
│    - Category-specific metadata                          │
│                                                          │
│ 💬 MESSAGE TEMPLATES                                     │
│    - Welcome message                                     │
│    - Product inquiry response                            │
│    - Booking confirmation                                │
│    - Order status updates                                │
│    - Follow-up reminders                                 │
│                                                          │
│ 🤖 AI CONFIGURATION                                      │
│    - System prompt for category                          │
│    - Sample conversations                                │
│    - Intent detection rules                              │
│    - Entity extraction (dates, sizes, colors)          │
│                                                          │
│ ⚡ WORKFLOW AUTOMATIONS                                  │
│    - Trigger conditions                                  │
│    - Action sequences                                    │
│    - Escalation rules                                    │
│    - Integration hooks                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Category Templates (Examples)

### 1. 🏥 Doctor/Clinic Template

#### **Use Case:**
- Patient books appointment via WhatsApp
- AI checks doctor availability
- Sends confirmation and reminder
- Shares prescription/reports after visit

#### **Data Schema:**
```typescript
interface ClinicService {
  name: string;              // "General Checkup", "X-Ray", "Blood Test"
  nameHindi: string;
  doctor: string;            // Doctor name
  duration: number;          // 30 mins
  price: number;             // ₹500
  availableSlots: string[];  // ["9:00 AM", "10:00 AM", ...]
}

interface Appointment {
  patientName: string;
  patientPhone: string;
  service: string;
  doctorName: string;
  appointmentDate: Date;
  timeSlot: string;
  symptoms?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}
```

#### **Message Templates:**
```yaml
welcome:
  en: "Welcome to {{clinicName}}! How can I help you today?\n1. Book Appointment\n2. Check Reports\n3. Contact Doctor"
  hi: "{{clinicName}} में आपका स्वागत है! मैं आपकी कैसे मदद कर सकता हूं?\n1. अपॉइंटमेंट बुक करें\n2. रिपोर्ट देखें\n3. डॉक्टर से संपर्क करें"

appointment_confirmation:
  en: "✅ Appointment confirmed!\n\nDoctor: {{doctorName}}\nDate: {{date}}\nTime: {{time}}\nService: {{service}}\nFee: ₹{{price}}\n\nAddress: {{clinicAddress}}\n\nWe'll send a reminder 1 day before."
  hi: "✅ अपॉइंटमेंट कन्फर्म हुआ!\n\nडॉक्टर: {{doctorName}}\nतारीख: {{date}}\nसमय: {{time}}\nसेवा: {{service}}\nशुल्क: ₹{{price}}\n\nपता: {{clinicAddress}}\n\nहम 1 दिन पहले रिमाइंडर भेजेंगे।"

reminder:
  en: "🔔 Reminder: Your appointment with Dr. {{doctorName}} is tomorrow at {{time}}. Reply YES to confirm or CANCEL to reschedule."
  hi: "🔔 रिमाइंडर: डॉ. {{doctorName}} के साथ आपकी अपॉइंटमेंट कल {{time}} बजे है। कन्फर्म करने के लिए YES भेजें या रीशेड्यूल करने के लिए CANCEL भेजें।"
```

#### **AI System Prompt:**
```
You are a helpful medical receptionist for {{clinicName}}.

Your responsibilities:
- Help patients book appointments
- Answer questions about services and doctors
- Provide clinic timings and location
- Check appointment availability
- Send appointment confirmations

Available services:
{{serviceList}}

Doctors and their specialties:
{{doctorList}}

Clinic hours: {{businessHours}}

Guidelines:
- Be professional and empathetic
- Ask for patient name, contact, and symptoms
- Suggest appropriate doctor based on symptoms
- Check calendar before confirming appointment
- Never give medical advice (refer to doctor)
- Always confirm appointment details before booking
```

#### **Workflows:**
1. **Appointment Booking Flow:**
   ```
   Customer: "I want to book appointment"
   → AI: "Which service? (List services)"
   → Customer: "General checkup"
   → AI: "Which date? (Show next 7 days)"
   → Customer: "Tomorrow"
   → AI: "Available slots: 9AM, 11AM, 3PM"
   → Customer: "11AM"
   → AI: "Your name?"
   → Customer: "Rahul Kumar"
   → AI: "Confirm: Dr. Sharma, Tomorrow 11AM, ₹500?"
   → Customer: "Yes"
   → Create appointment in database
   → Send confirmation WhatsApp + Email
   → Schedule reminder for 1 day before
   ```

2. **Reminder Workflow (Automated):**
   ```
   Trigger: 24 hours before appointment
   → Send reminder WhatsApp message
   → Wait for confirmation
   → If "CANCEL" → Offer reschedule options
   → If no reply → Send second reminder 2 hours before
   ```

---

### 2. 👗 Cloth Shop Template

#### **Use Case:**
- Customer browses catalog on WhatsApp
- AI shows products with images
- Customer asks about size, color, price
- Places order with home delivery

#### **Data Schema:**
```typescript
interface ClothProduct {
  name: string;              // "Men's Cotton Shirt"
  nameHindi: string;         // "पुरुषों की कॉटन शर्ट"
  category: string;          // "Shirts", "Sarees", "Jeans"
  fabric: string;            // "Cotton", "Silk", "Denim"
  sizes: string[];           // ["S", "M", "L", "XL", "XXL"]
  colors: string[];          // ["Red", "Blue", "Black"]
  price: number;
  images: string[];
  inStock: boolean;
  description: string;
}

interface Order {
  items: Array<{
    productId: string;
    size: string;
    color: string;
    quantity: number;
  }>;
  deliveryAddress: string;
  totalAmount: number;
  paymentMethod: 'COD' | 'Online';
}
```

#### **Message Templates:**
```yaml
catalog_intro:
  en: "Welcome to {{shopName}}! 👗\n\nBrowse our collection:\n1. Shirts\n2. Sarees\n3. Jeans\n4. Kurtis\n5. Kids Wear\n\nReply with category number or send 'HELP'"
  hi: "{{shopName}} में आपका स्वागत है! 👗\n\nहमारा कलेक्शन देखें:\n1. शर्ट\n2. साड़ियां\n3. जींस\n4. कुर्तियां\n5. बच्चों के कपड़े\n\nकैटेगरी नंबर भेजें या 'HELP' लिखें"

product_details:
  en: "{{productName}}\n\n💰 Price: ₹{{price}}\n📐 Sizes: {{sizes}}\n🎨 Colors: {{colors}}\n📦 In Stock: {{stock}}\n\n{{description}}\n\nReply SIZE and COLOR to order\nExample: 'L size, Blue color'"
  hi: "{{productName}}\n\n💰 कीमत: ₹{{price}}\n📐 साइज़: {{sizes}}\n🎨 रंग: {{colors}}\n📦 स्टॉक में: {{stock}}\n\n{{description}}\n\nऑर्डर के लिए SIZE और COLOR बताएं\nउदाहरण: 'L size, नीला'"

order_confirmation:
  en: "🛍️ Order confirmed!\n\nItems:\n{{itemList}}\n\nTotal: ₹{{total}}\nDelivery: {{deliveryTime}}\nPayment: {{paymentMethod}}\n\nAddress: {{address}}\n\nOrder ID: {{orderId}}\nTrack: {{trackingLink}}"
```

#### **AI System Prompt:**
```
You are a helpful sales assistant for {{shopName}}, a clothing store.

Your responsibilities:
- Show product catalog to customers
- Answer questions about sizes, colors, fabric, price
- Help customers place orders
- Provide delivery and return policy info
- Suggest products based on customer preferences

Product catalog:
{{productList}}

Guidelines:
- Be friendly and enthusiastic about products
- Show product images when available
- Ask for size and color before confirming order
- Mention delivery charges (Free above ₹500)
- Offer bulk discounts (10% on 5+ items)
- Always confirm order details before placing
- Suggest similar products if item out of stock
```

#### **Workflows:**
1. **Product Browse & Order:**
   ```
   Customer: "Show me shirts"
   → AI: Shows shirt category (with images)
   → Customer: "Blue shirt price?"
   → AI: "₹599, available in S, M, L, XL"
   → Customer: "M size chahiye" (I want M size)
   → AI: "Confirm: Blue Cotton Shirt, Size M, ₹599?"
   → Customer: "Yes"
   → AI: "Delivery address?"
   → Customer: Shares location/address
   → AI: "Payment: COD or Online?"
   → Customer: "COD"
   → Create order
   → Send confirmation
   → Notify seller in dashboard
   ```

2. **Size/Color Inquiry:**
   ```
   Customer sends product image or name
   → AI searches product in catalog
   → Shows available sizes and colors
   → If size not available → Suggests similar product
   → If color not available → Shows alternative colors
   ```

---

### 3. 🍔 Restaurant Template

#### **Use Case:**
- Customer orders food via WhatsApp
- AI shows menu with prices
- Takes order with customization
- Confirms delivery time and address

#### **Data Schema:**
```typescript
interface MenuItem {
  name: string;              // "Paneer Butter Masala"
  nameHindi: string;
  category: string;          // "Main Course", "Starters", "Desserts"
  type: 'veg' | 'non-veg' | 'vegan';
  price: number;
  customizations: Array<{
    name: string;            // "Spice Level"
    options: string[];       // ["Mild", "Medium", "Spicy"]
  }>;
  preparationTime: number;   // 20 minutes
  images: string[];
  available: boolean;
}

interface FoodOrder {
  items: Array<{
    menuItemId: string;
    quantity: number;
    customizations: Record<string, string>;
    specialInstructions?: string;
  }>;
  deliveryAddress?: string;
  deliveryType: 'delivery' | 'pickup' | 'dine-in';
  scheduledTime?: Date;
  totalAmount: number;
}
```

#### **Message Templates & Workflows:**
```yaml
menu_intro:
  en: "Welcome to {{restaurantName}}! 🍽️\n\nOur Menu:\n🥗 Starters\n🍛 Main Course\n🍚 Rice & Breads\n🍨 Desserts\n☕ Beverages\n\nReply category name or 'FULL MENU'"

order_confirmation:
  en: "✅ Order confirmed!\n\nItems:\n{{itemList}}\n\nTotal: ₹{{total}}\nPreparation time: {{time}} mins\nDelivery: {{deliveryTime}}\n\nYour order will arrive by {{eta}}"

delivery_update:
  en: "🚗 Your order is out for delivery!\n\nDelivery partner: {{name}}\nContact: {{phone}}\nExpected: {{time}}\nTrack: {{link}}"
```

---

## 🛠️ Implementation Options

### Option 1: Built-in Template System (Recommended for MVP)

**Pros:**
- Full control over features
- Tight integration with your app
- No external dependencies
- Lower cost

**Cons:**
- More development time
- Need to build UI for template management

**Architecture:**
```typescript
// Database Schema
interface Template {
  _id: string;
  category: 'clinic' | 'retail' | 'restaurant' | 'salon' | 'custom';
  name: string;
  description: string;
  
  // Data structure for this template
  schema: {
    products?: ProductSchema;
    services?: ServiceSchema;
    appointments?: AppointmentSchema;
  };
  
  // Pre-configured messages
  messageTemplates: Record<string, {
    en: string;
    hi: string;
    variables: string[];
  }>;
  
  // AI configuration
  aiConfig: {
    systemPrompt: string;
    examples: Array<{ input: string; output: string }>;
    intents: string[];
  };
  
  // Workflow definitions
  workflows: Array<{
    name: string;
    trigger: WorkflowTrigger;
    actions: WorkflowAction[];
  }>;
}

// When business signs up
business.template = 'clinic';  // Selected template
business.customizations = {};  // Template overrides
```

**Implementation Steps:**
1. Create `Template` model in MongoDB
2. Seed database with 5-6 default templates
3. Add "Select Template" step in registration
4. Load template on business creation
5. Allow customization in Settings page

---

### Option 2: n8n Integration (Recommended for Advanced Workflows)

**Pros:**
- Visual workflow editor
- Hundreds of pre-built integrations
- Non-technical users can build flows
- Mature ecosystem

**Cons:**
- Another service to host/maintain
- Learning curve for sellers
- Costs scale with executions

**How It Works:**
```
1. Your app exposes webhooks for events:
   - Message received
   - Order placed
   - Appointment booked
   
2. Seller creates workflow in n8n:
   ┌─────────────────────────────────────────┐
   │ Trigger: Message Received               │
   └─────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────┐
   │ Check: Contains "appointment"?          │
   └─────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────┐
   │ Call your API: GET /products            │
   └─────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────┐
   │ AI Node: Generate response              │
   └─────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────┐
   │ Send WhatsApp: Reply to customer        │
   └─────────────────────────────────────────┘

3. Your app receives result and logs it
```

**Setup:**
```yaml
# docker-compose.yml (add n8n service)
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=yourpassword
    volumes:
      - n8n_data:/home/node/.n8n
```

**Backend Integration:**
```typescript
// Expose webhook for n8n
app.post('/api/webhooks/n8n/message', async (req, res) => {
  const { businessId, message, customerId } = req.body;
  
  // n8n can process and return response
  // or just trigger workflow
  
  res.json({ success: true });
});

// Call n8n workflow from your code
async function triggerN8nWorkflow(workflowId: string, data: any) {
  const response = await fetch(`http://n8n:5678/webhook/${workflowId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

---

### Option 3: Zapier Integration (Easiest for Non-technical Users)

**Pros:**
- No hosting needed
- 5000+ app integrations
- Seller-friendly UI
- Quick setup

**Cons:**
- Costs per task ($$$)
- Less control
- Latency concerns

**How to Use:**
1. Create Zapier app integration for your platform
2. Expose API endpoints for Zapier
3. Sellers connect their account to Zapier
4. Build "Zaps" for automation:
   - "When new message → Search product → Send reply"
   - "When order placed → Send to Google Sheets"
   - "When appointment booked → Add to Google Calendar"

---

### Option 4: Internal Low-Code Builder (Long-term)

Build your own visual workflow builder inside your app.

**Pros:**
- Full branding
- Tightest integration
- No external costs
- Can charge premium for it

**Cons:**
- 4-6 weeks development time
- Complex UI/UX
- Maintenance overhead

**Example UI:**
```
┌────────────────────────────────────────────────┐
│  Workflow Builder - Appointment Booking        │
├────────────────────────────────────────────────┤
│                                                │
│  [+] Add Trigger                               │
│    ↓                                           │
│  📧 When: Customer says "appointment"          │
│    ↓                                           │
│  [+] Add Action                                │
│    ↓                                           │
│  🤖 AI Action: Detect date and time            │
│    ↓                                           │
│  📅 Check: Doctor availability                 │
│    ↓                                           │
│  ✅ Create: Appointment in database            │
│    ↓                                           │
│  💬 Send: Confirmation message                 │
│                                                │
│  [Save Workflow]  [Test]  [Activate]          │
└────────────────────────────────────────────────┘
```

---

## 🚀 Recommended Approach (Phased)

### Phase 1: MVP (Weeks 1-4)
**Built-in Templates (3-5 categories)**

1. **Database schema:**
   ```typescript
   // Add to Business model
   category: 'clinic' | 'retail' | 'restaurant' | 'salon' | 'general';
   templateConfig: {
     messageTemplates: Record<string, string>;
     aiPromptOverrides: string;
     workflowRules: Array<WorkflowRule>;
   };
   ```

2. **On registration, ask:**
   - "What type of business?" (dropdown)
   - Load template based on selection
   - Pre-populate products/services based on template

3. **Simple rule engine in code:**
   ```typescript
   // backend/src/services/workflow.service.ts
   async function processMessage(message: string, business: Business) {
     const template = getTemplate(business.category);
     
     // Check intent
     if (template.detectIntent(message) === 'appointment') {
       return handleAppointmentFlow(message, business);
     }
     
     if (template.detectIntent(message) === 'product_inquiry') {
       return handleProductInquiry(message, business);
     }
     
     // Default AI response
     return generateAIResponse(message, business);
   }
   ```

### Phase 2: Advanced (Weeks 5-8)
**Add n8n Integration**

1. Deploy n8n alongside your app
2. Create 5-10 pre-built workflow templates
3. Add "Workflows" page in dashboard:
   - "Import Template"
   - "Create Custom Workflow"
   - Link to n8n editor
4. Expose webhooks for n8n to call

### Phase 3: Scale (Month 3+)
**Build Internal Workflow Builder**

1. Visual drag-and-drop editor
2. Pre-built blocks:
   - Triggers (message, order, appointment)
   - Conditions (contains keyword, time-based)
   - Actions (send message, create order, call API)
   - AI blocks (intent detection, response generation)
3. Template marketplace (sellers share workflows)

---

## 📊 Template Comparison Matrix

| Category | Products | Appointments | Orders | Key Features |
|----------|----------|--------------|--------|-------------|
| **Clinic** | Services | ✅ Yes | No | Doctor availability, prescriptions |
| **Retail (Clothes)** | ✅ Products | No | ✅ Yes | Size/color, bulk orders, delivery |
| **Restaurant** | Menu items | Optional | ✅ Yes | Customization, delivery tracking |
| **Salon/Spa** | Services | ✅ Yes | No | Stylist selection, package deals |
| **Real Estate** | Properties | ✅ Site visits | No | Property details, virtual tours |
| **Education** | Courses | ✅ Classes | ✅ Enrollments | Batch selection, fee payment |

---

## 🎯 Implementation Plan

### Week 1: Database & Backend
- [ ] Add `category` field to Business model
- [ ] Create Template model
- [ ] Seed 3 templates (clinic, retail, restaurant)
- [ ] Add template selection to registration

### Week 2: Template Logic
- [ ] Create workflow engine (rule-based)
- [ ] Implement intent detection per template
- [ ] Build message template renderer
- [ ] Test with sample data

### Week 3: Frontend
- [ ] Add category selector in registration
- [ ] Show template preview
- [ ] Allow customization in Settings
- [ ] Display active workflows

### Week 4: Testing & Polish
- [ ] Test each template end-to-end
- [ ] Create demo videos per category
- [ ] Write documentation
- [ ] Beta test with 2-3 businesses per category

---

## 💡 Key Takeaways

1. **Start with 3-5 built-in templates** (clinic, retail, restaurant)
2. **Use simple rule-based engine** for MVP (no need for complex workflow tool initially)
3. **Add n8n integration** when you have 20+ customers and they request customization
4. **Build internal workflow builder** only if it becomes a selling point (Month 3+)
5. **Focus on message templates and AI prompts** first - they give 80% of the value

---

## 📚 Next Steps

1. **Read this document completely** ✅ (You're here)
2. **Decide:** Built-in templates OR n8n integration?
3. **If built-in:** Follow "Week 1-4" implementation plan above
4. **If n8n:** See detailed n8n integration guide in previous chat
5. **Create first template:** Start with "Retail Shop" (simplest)
6. **Test thoroughly:** Use it for your own business or beta tester
7. **Iterate:** Add more templates based on customer demand

---

**Status:** Template system design complete ✅  
**Recommendation:** Start with built-in templates (3 categories)  
**Time estimate:** 3-4 weeks to production-ready templates  
**Next file to create:** `WORKFLOW_ENGINE.md` (detailed implementation guide)
