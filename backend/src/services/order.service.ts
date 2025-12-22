import { aiService } from '../services/ai.service';
import Order from '../models/Order';
import Product from '../models/Product';
import Chat from '../models/Chat';
import { whatsappService } from '../services/whatsapp.service';
import { logger } from '../utils/logger';
import { getIo } from '../utils/socket';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

interface PendingOrder {
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress?: string;
  step: 'items' | 'confirmation' | 'address' | 'completed';
}

// Store pending orders in memory (in production, use Redis)
const pendingOrders: Map<string, PendingOrder> = new Map();

export class OrderService {
  // Process order-related message
  async processOrderMessage(
    message: string,
    chatId: string,
    customerPhone: string,
    businessId: string
  ): Promise<string | null> {
    try {
      // Detect intent
      const intent = await aiService.detectIntent(message);

      // Check if user wants to order
      if (intent.intent === 'order' || this.isOrderIntent(message)) {
        return await this.startOrderFlow(message, chatId, customerPhone, businessId);
      }

      // Check if user is in an existing order flow
      const pendingOrder = pendingOrders.get(chatId);
      if (pendingOrder) {
        return await this.continueOrderFlow(
          message,
          chatId,
          customerPhone,
          businessId,
          pendingOrder
        );
      }

      return null; // Not an order-related message
    } catch (error) {
      logger.error('Error processing order message:', error);
      return null;
    }
  }

  // Check if message indicates order intent
  private isOrderIntent(message: string): boolean {
    const orderKeywords = [
      'order',
      'buy',
      'purchase',
      'book',
      'booking',
      'lena hai',
      'chahiye',
      'kharidna',
      'order karna',
    ];
    const lowerMessage = message.toLowerCase();
    return orderKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  // Start order flow
  private async startOrderFlow(
    message: string,
    chatId: string,
    customerPhone: string,
    businessId: string
  ): Promise<string> {
    // Extract product name from message
    const products = await this.findProductsInMessage(message, businessId);

    if (products.length === 0) {
      return `I'd love to help you place an order! Which product would you like to order?

मैं आपको ऑर्डर देने में मदद करना चाहूंगा! आप कौन सा product order करना चाहेंगे?`;
    }

    // Single product found
    if (products.length === 1) {
      const product = products[0];
      // Extract size and color if supplied in message
      const { size, color } = this.extractSizeAndColor(message);

      const orderItem: OrderItem = {
        productId: product._id.toString(),
        productName: product.name,
        quantity: this.extractQuantity(message) || 1,
        price: product.price,
        // optional attributes for apparel/electronics
        ...(size ? { size } : {}),
        ...(color ? { color } : {}),
      };

      const totalAmount = orderItem.quantity * orderItem.price;

      pendingOrders.set(chatId, {
        items: [orderItem],
        totalAmount,
        step: 'confirmation',
      });

      return `Great! Here's your order summary:

📦 ${orderItem.quantity}x ${product.name} ${product.nameHindi ? `(${product.nameHindi})` : ''}
💰 Total: ₹${totalAmount}

Type "confirm" to place the order or "cancel" to cancel.

अपना ऑर्डर confirm करने के लिए "confirm" लिखें या cancel करने के लिए "cancel" लिखें।`;
    }

    // Multiple products found - ask for clarification
    const productList = products
      .slice(0, 5)
      .map((p, i) => `${i + 1}. ${p.name} - ₹${p.price}`)
      .join('\n');

    return `I found multiple products. Which one would you like to order?

${productList}

Please reply with the number or name of the product.`;
  }

  // Continue order flow
  private async continueOrderFlow(
    message: string,
    chatId: string,
    customerPhone: string,
    businessId: string,
    pendingOrder: PendingOrder
  ): Promise<string> {
    const lowerMessage = message.toLowerCase().trim();

    // Handle cancellation
    if (lowerMessage.includes('cancel') || lowerMessage.includes('no')) {
      pendingOrders.delete(chatId);
      return `Order cancelled. Let me know if you'd like to order something else!

ऑर्डर cancel कर दिया गया। कुछ और चाहिए तो बताएं!`;
    }

    // Handle confirmation step
    if (pendingOrder.step === 'confirmation') {
      if (lowerMessage.includes('confirm') || lowerMessage.includes('yes') || lowerMessage.includes('haan')) {
        pendingOrder.step = 'address';
        pendingOrders.set(chatId, pendingOrder);

        return `Perfect! Please provide your delivery address.

कृपया अपना delivery address बताएं।`;
      }

      return `Please type "confirm" to proceed with the order or "cancel" to cancel.`;
    }

    // Handle address step
    if (pendingOrder.step === 'address') {
      pendingOrder.deliveryAddress = message;
      pendingOrder.step = 'completed';

      // Create the order
      const chat = await Chat.findById(chatId);
      if (!chat) {
        pendingOrders.delete(chatId);
        return 'Error: Chat not found. Please try again.';
      }

      // Atomically check and reserve stock for each item
      for (const it of pendingOrder.items) {
        // Atomically decrement stock only if enough is available
        const updatedProd = await Product.findOneAndUpdate(
          { _id: it.productId, stock: { $gte: it.quantity } },
          { $inc: { stock: -it.quantity } },
          { new: true }
        );
        if (!updatedProd) {
          // do not create, inform customer
          pendingOrders.delete(chatId);
          const prod = await Product.findById(it.productId);
          const available = prod?.stock ?? 0;
          return `Sorry, we don't have enough stock for ${it.productName}. Available: ${available}, you requested: ${it.quantity}. Please choose a smaller quantity or another product.`;
        }
        // Update inStock status
        updatedProd.inStock = !!updatedProd.stock && updatedProd.stock > 0;
        await updatedProd.save();
      }
      const order = await Order.create({
        businessId,
        chatId,
        customerPhone,
        customerName: chat.customerName,
        items: pendingOrder.items,
        totalAmount: pendingOrder.totalAmount,
        deliveryAddress: pendingOrder.deliveryAddress,
        status: 'pending',
      });

      pendingOrders.delete(chatId);

      // Emit real-time event to business room
      try {
        const io = getIo();
        if (io) io.to(businessId).emit('order.created', { orderId: order._id, total: order.totalAmount, chatId: order.chatId });
      } catch (err) {
        logger.error('Failed to emit order.created event', err);
      }

      const orderSummary = pendingOrder.items
        .map((item) => `${item.quantity}x ${item.productName} - ₹${item.price}`)
        .join('\n');

      return `✅ Order Placed Successfully! 

Order ID: #${order._id.toString().slice(-6).toUpperCase()}

${orderSummary}

Total: ₹${pendingOrder.totalAmount}
Delivery Address: ${pendingOrder.deliveryAddress}

We'll confirm your order shortly and keep you updated!

धन्यवाद! हम जल्द ही आपके ऑर्डर की पुष्टि करेंगे। 🙏`;
    }

    return 'I didn\'t understand that. Please try again.';
  }

  // Find products mentioned in message
  private async findProductsInMessage(
    message: string,
    businessId: string
  ): Promise<any[]> {
    const products = await aiService.searchProducts(message, businessId);
    return products;
  }

  // Extract quantity from message
  private extractQuantity(message: string): number {
    // Look for patterns like "2x", "2 calculator", "two calculators"
    const patterns = [
      /(\d+)\s*x/i,
      /(\d+)\s+(piece|pieces|quantity)/i,
      /(\d+)\s+(?:of|ka)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const qty = parseInt(match[1]);
        if (qty > 0 && qty <= 100) {
          return qty;
        }
      }
    }

    // Check for number words
    const numberWords: { [key: string]: number } = {
      one: 1, ek: 1,
      two: 2, do: 2,
      three: 3, teen: 3,
      four: 4, char: 4,
      five: 5, paanch: 5,
    };

    for (const [word, num] of Object.entries(numberWords)) {
      if (message.toLowerCase().includes(word)) {
        return num;
      }
    }

    return 1; // Default quantity
  }

  // Extract size and color from text (basic heuristics)
  private extractSizeAndColor(message: string): { size?: string; color?: string } {
    const lower = message.toLowerCase();

    // Sizes (common): XS, S, M, L, XL, XXL, numeric sizes like 30,32
    const sizeMatch = lower.match(/\b(xs|s|m|l|xl|xxl|\d{2})\b/gi);
    const size = sizeMatch ? sizeMatch[0].toUpperCase() : undefined;

    // Color list, small curated set - extend as needed
    const colors = ['red','blue','green','black','white','yellow','pink','brown','grey','gray','navy','beige'];
    let color: string | undefined;
    for (const c of colors) {
      if (lower.includes(c)) { color = c; break; }
    }

    // Accept Hindi color words too (simple mapping)
    const hindiColorMap: Record<string,string> = { 'नीला': 'blue', 'लाल': 'red', 'काला': 'black', 'सफ़ेद': 'white', 'हरा': 'green' };
    for (const [h, eng] of Object.entries(hindiColorMap)) {
      if (lower.includes(h)) { color = color || eng; break; }
    }

    return { size, color };
  }

  // Get pending order for a chat
  getPendingOrder(chatId: string): PendingOrder | undefined {
    return pendingOrders.get(chatId);
  }

  // Clear pending order
  clearPendingOrder(chatId: string): void {
    pendingOrders.delete(chatId);
  }
}

export const orderService = new OrderService();
