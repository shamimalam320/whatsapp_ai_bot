import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import Template from '../models/Template';
import { logger } from '../utils/logger';

dotenv.config();

async function run() {
  try {
    await connectDB();
    const count = await Template.countDocuments();
    if (count > 0) {
      logger.info('Templates already exist, aborting seed.');
      process.exit(0);
    }

    await Template.create({
      name: 'Retail Shop (Clothes & Electronics)',
      category: 'retail',
      description: 'Retail template optimized for product catalog, sizing, color selection and orders.',
      messageTemplates: {
        welcome: {
          en: "Welcome to {{shopName}}! 👋\nReply with what you are looking for or type 'MENU' to browse categories.",
          hi: "{{shopName}} में आपका स्वागत है! 👋\nजो भी चाहिए बताएं या 'MENU' लिखकर कैटेगरी देखें।"
        },
        product_details: {
          en: "{{productName}}\nPrice: ₹{{price}}\nSizes: {{sizes}}\nColors: {{colors}}\nReply with Size and Color to order. Example: 'M, Blue'",
          hi: "{{productName}}\nकीमत: ₹{{price}}\nसाइज़: {{sizes}}\nरंग: {{colors}}\nऑर्डर के लिए साइज़ और रंग भेजें। उदाहरण: 'M, Blue'"
        },
        order_confirm: {
          en: "✅ Order placed! Order ID: {{orderId}}\nTotal: ₹{{total}}\nWe will confirm shortly.",
          hi: "✅ ऑर्डर दिया गया! ऑर्डर आईडी: {{orderId}}\nकुल: ₹{{total}}\nहम जल्द ही पुष्टि करेंगे।"
        }
      },
      aiConfig: {
        systemPrompt: "You are a helpful retail assistant. Help users browse products, select sizes and colors, and place orders. Ask for delivery address before placing orders."
      },
      workflows: [
        {
          name: 'retail_order_flow',
          trigger: 'message_contains',
          conditions: ['order','want','chahiye','buy','lena'],
          actions: ['show_product_candidates','collect_size_color','confirm_order','save_order']
        }
      ]
    });

    logger.info('Retail template seeded successfully');
    process.exit(0);
  } catch (error: any) {
    logger.error('Error seeding templates:', error);
    process.exit(1);
  }
}

run();
