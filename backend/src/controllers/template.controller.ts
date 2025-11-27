import { Request, Response } from 'express';
import Template from '../models/Template';
import { logger } from '../utils/logger';

export const listTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await Template.find();
    res.json({ success: true, data: templates });
  } catch (error: any) {
    logger.error('Error fetching templates', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tmpl = await Template.findById(id);
    if (!tmpl) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: tmpl });
  } catch (error: any) {
    logger.error('Error fetching template', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// For adm/development: create seed templates
export const seedTemplates = async (req: Request, res: Response) => {
  try {
    // Only run if DB doesn't have templates
    const count = await Template.countDocuments();
    if (count > 0) return res.json({ success: true, message: 'Templates already seeded' });

    const retail = await Template.create({
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

    res.json({ success: true, data: [retail] });
  } catch (error: any) {
    logger.error('Error seeding templates', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
