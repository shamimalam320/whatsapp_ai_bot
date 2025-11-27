import OpenAI from 'openai';
import { logger } from '../utils/logger';
import Product from '../models/Product';
import Business from '../models/Business';

class AIService {
  private openai: OpenAI | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === 'sk-your-openai-api-key-here') {
      logger.warn('OpenAI API key not configured. AI responses will be simulated.');
      this.isConfigured = false;
      return;
    }

    try {
      this.openai = new OpenAI({ apiKey });
      this.isConfigured = true;
      logger.info('OpenAI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OpenAI service:', error);
      this.isConfigured = false;
    }
  }

  // Generate AI response based on customer message
  async generateResponse(
    customerMessage: string,
    businessId: string,
    chatHistory: any[] = []
  ): Promise<string> {
    try {
      // Get business details for context
      const business = await Business.findById(businessId);
      if (!business) {
        throw new Error('Business not found');
      }

      // Get products for context
      const products = await Product.find({
        businessId,
        isActive: true,
      })
        .limit(50)
        .select('name nameHindi description price category');

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(business, products);

      // Build conversation messages
      const messages: any[] = [{ role: 'system', content: systemPrompt }];

      // Find relevant products for this query and add them to the prompt to improve factual accuracy
      const relevantProducts = await this.searchProducts(customerMessage, businessId);
      let relevantProductsSection = '';
      if (relevantProducts && relevantProducts.length > 0) {
        relevantProductsSection = 'RELEVANT PRODUCTS (based on the customer query):\n' +
          relevantProducts
            .slice(0, 3)
            .map(
              (p: any) =>
                `• ${p.name}${p.nameHindi ? ` (${p.nameHindi})` : ''} — ₹${p.price} — ${
                  p.description || 'No description'
                }`
            )
            .join('\n') +
          '\n\n';
      }

      // Add a few-shot example exchange to bias responses toward concise, product-focused replies
      const examples = [
        { role: 'user', content: 'Do you have a smart watch? What is the price?' },
        {
          role: 'assistant',
          content:
            'Yes — Smart Watch (Model X): ₹1,999. It features heart-rate monitoring and 7-day battery life. Would you like to place an order? Reply with the product name to proceed.',
        },
        { role: 'user', content: 'How long does delivery take?' },
        { role: 'assistant', content: 'Delivery typically takes 3-5 business days within India. Free shipping for orders above ₹2,000.' },
      ];

      // If we have relevant products, add them as an assistant-context message before examples
      if (relevantProductsSection) {
        messages.push({ role: 'assistant', content: relevantProductsSection });
      }

      messages.push(...examples);

      // Add recent chat history (last 10 messages) to keep context
      const recentHistory = chatHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({ role: msg.sender === 'customer' ? 'user' : 'assistant', content: msg.text });
      }

      // Add current customer message
      messages.push({ role: 'user', content: customerMessage });

      // Check if configured
      if (!this.isConfigured || !this.openai) {
        return this.generateMockResponse(customerMessage, business, products);
      }

      // Generate response with OpenAI
      // Use lower temperature by default for factual replies; businesses can override via aiConfig
      const model = business.aiConfig?.model || 'gpt-4o-mini';
      const temperature = typeof business.aiConfig?.temperature === 'number' ? business.aiConfig.temperature : 0.2;

      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: 400,
      });

      const response = completion.choices[0]?.message?.content || 
        'I apologize, but I am unable to respond at the moment. Please try again.';

      logger.info('AI response generated successfully');
      return response;
    } catch (error: any) {
      logger.error('Error generating AI response:', error);
      return 'I apologize for the inconvenience. I am experiencing technical difficulties. Please contact our support team for assistance.';
    }
  }

  // Build system prompt with business context
  private buildSystemPrompt(business: any, products: any[]): string {
    const productList = products
      .map(
        (p) =>
          `- ${p.name} ${p.nameHindi ? `(${p.nameHindi})` : ''}: ${p.description || 'No description'} - ₹${p.price}`
      )
      .join('\n');

    const languages = business.languages?.join(', ') || 'English, Hindi';

    return `You are a helpful customer service assistant for ${business.name}, a ${business.industry} business.

IMPORTANT GUIDELINES:
- Be friendly, professional, and helpful
- Respond in the same language the customer uses (support: ${languages})
- If customer writes in Hinglish (mix of Hindi and English), respond in Hinglish
- Keep responses concise and clear
- If asked about products not in our catalog, politely say we don't have it
- Always provide prices in Indian Rupees (₹)
- Help customers find the right products
- Answer questions about orders, delivery, and payments
- If you don't know something, be honest and offer to connect them with a human

BUSINESS HOURS: ${business.businessHours?.start || '9:00 AM'} - ${business.businessHours?.end || '9:00 PM'}

AVAILABLE PRODUCTS:
${productList || 'No products available at the moment.'}

COMMON TASKS:
1. Help customers find products
2. Provide product information and prices
3. Assist with order placement
4. Answer common questions
5. Handle complaints professionally
6. Provide delivery information

Remember: You represent ${business.name}. Be courteous, accurate, and helpful!`;
  }

  // Generate mock response for development/testing
  private generateMockResponse(
    message: string,
    business: any,
    products: any[]
  ): string {
    const lowerMessage = message.toLowerCase();

    // Greeting detection
    if (
      lowerMessage.match(
        /^(hi|hello|hey|namaste|namaskar|नमस्ते|हैलो|हाय)/i
      )
    ) {
      return `Hello! Welcome to ${business.name}! 🙏 How can I help you today?\n\nमैं आपकी कैसे मदद कर सकता हूं?`;
    }

    // Product inquiry
    if (
      lowerMessage.includes('product') ||
      lowerMessage.includes('item') ||
      lowerMessage.includes('sale') ||
      lowerMessage.includes('available')
    ) {
      if (products.length === 0) {
        return 'We currently have no products available. Please check back later!';
      }

      const productList = products
        .slice(0, 5)
        .map(
          (p) =>
            `• ${p.name} ${p.nameHindi ? `(${p.nameHindi})` : ''} - ₹${p.price}`
        )
        .join('\n');

      return `Here are some of our products:\n\n${productList}\n\nWould you like more information about any of these?`;
    }

    // Price inquiry
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      if (products.length > 0) {
        const product = products[0];
        return `Our ${product.name} is priced at ₹${product.price}. Would you like to know about other products?`;
      }
    }

    // Order inquiry
    if (
      lowerMessage.includes('order') ||
      lowerMessage.includes('buy') ||
      lowerMessage.includes('purchase')
    ) {
      return `Great! I can help you place an order. Please let me know which product you're interested in, and I'll assist you with the ordering process.\n\nकौन सा product आपको चाहिए?`;
    }

    // Help/Support
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return `I'm here to help! I can assist you with:\n\n1. Product information\n2. Pricing details\n3. Order placement\n4. Delivery information\n5. Any other questions\n\nWhat would you like to know?`;
    }

    // Business hours
    if (lowerMessage.includes('timing') || lowerMessage.includes('hours') || lowerMessage.includes('open')) {
      return `We are open from ${business.businessHours?.start || '9:00 AM'} to ${business.businessHours?.end || '9:00 PM'}. How can I assist you today?`;
    }

    // Default response
    return `Thank you for your message! I'm here to help you with any questions about ${business.name}. You can ask me about our products, prices, or place an order. How can I assist you?\n\nमैं आपकी मदद के लिए यहां हूं। आप क्या जानना चाहेंगे?`;
  }

  // Detect customer intent
  async detectIntent(message: string): Promise<{
    intent: string;
    confidence: number;
    entities: any;
  }> {
    const lowerMessage = message.toLowerCase();

    // Simple rule-based intent detection
    if (
      lowerMessage.match(/order|buy|purchase|booking|book/i)
    ) {
      return {
        intent: 'order',
        confidence: 0.9,
        entities: { action: 'order_placement' },
      };
    }

    if (
      lowerMessage.match(/price|cost|kitna|kitne|rate|₹/i)
    ) {
      return {
        intent: 'price_inquiry',
        confidence: 0.85,
        entities: { action: 'price_check' },
      };
    }

    if (
      lowerMessage.match(/product|item|available|stock|hai|he|milega/i)
    ) {
      return {
        intent: 'product_inquiry',
        confidence: 0.8,
        entities: { action: 'product_search' },
      };
    }

    if (
      lowerMessage.match(/help|support|problem|issue|complaint/i)
    ) {
      return {
        intent: 'support',
        confidence: 0.85,
        entities: { action: 'customer_support' },
      };
    }

    if (
      lowerMessage.match(/delivery|shipping|courier|deliver/i)
    ) {
      return {
        intent: 'delivery_inquiry',
        confidence: 0.8,
        entities: { action: 'delivery_info' },
      };
    }

    return {
      intent: 'general',
      confidence: 0.5,
      entities: {},
    };
  }

  // Search products based on query
  async searchProducts(query: string, businessId: string): Promise<any[]> {
    try {
      const searchRegex = new RegExp(query, 'i');

      const products = await Product.find({
        businessId,
        isActive: true,
        $or: [
          { name: searchRegex },
          { nameHindi: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
        ],
      })
        .limit(5)
        .select('name nameHindi description price category images');

      return products;
    } catch (error) {
      logger.error('Error searching products:', error);
      return [];
    }
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

export const aiService = new AIService();
