import { Request, Response } from 'express';

// Import models lazily to avoid circular imports at startup
const Product = (async () => (await import('../models/Product')).default)();
const Chat = (async () => (await import('../models/Chat')).default)();
const Order = (async () => (await import('../models/Order')).default)();

/**
 * GET /api/analytics/overview
 * Returns basic counts used by the dashboard UI for the current business
 */
export const getOverview = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;

    if (!businessId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const [ProductModel, ChatModel, OrderModel] = await Promise.all([Product, Chat, Order]);

    const [productCount, chatCount, orderCount, customerPhones] = await Promise.all([
      ProductModel.countDocuments({ businessId }),
      ChatModel.countDocuments({ businessId }),
      OrderModel.countDocuments({ businessId }),
      ChatModel.distinct('customerPhone', { businessId })
    ]);

    const uniqueCustomers = Array.isArray(customerPhones) ? customerPhones.length : 0;

    return res.json({
      success: true,
      data: {
        products: productCount,
        chats: chatCount,
        orders: orderCount,
        customers: uniqueCustomers
      }
    });
  } catch (error: any) {
    console.error('Analytics overview error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Simple placeholder controllers for future expansion (chats, sales)
export const getChatAnalytics = async (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Chat analytics - TODO' });
};

export const getSalesAnalytics = async (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Sales analytics - TODO' });
};
