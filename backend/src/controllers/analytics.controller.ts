import { Request, Response } from 'express';

// Import models lazily to avoid circular imports at startup
const Product = (async () => (await import('../models/Product')).default)();
const Chat = (async () => (await import('../models/Chat')).default)();
const Order = (async () => (await import('../models/Order')).default)();
const Faq = (async () => (await import('../models/Faq')).default)();

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

    // Count only active products to match product listing which shows only active products
    const [productCount, chatCount, orderCount, customerPhones] = await Promise.all([
      ProductModel.countDocuments({ businessId, isActive: true }),
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

/**
 * GET /api/analytics/dashboard
 * Returns comprehensive analytics including time-based data, revenue, popular products, etc.
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Parse date range from query params (default to last 30 days)
    const { startDate, endDate } = req.query;
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [ProductModel, ChatModel, OrderModel, FaqModel] = await Promise.all([Product, Chat, Order, Faq]);

    // Run all analytics queries in parallel
    const [
      // Count only active products in dashboard summary to match the Products list
      totalProducts,
      totalChats,
      totalOrders,
      totalFaqs,
      activeProducts,
      activeFaqs,
      customerPhones,
      recentChats,
      recentOrders,
      ordersInRange,
      chatsInRange,
      pendingOrders,
      completedOrders,
      cancelledOrders
    ] = await Promise.all([
      ProductModel.countDocuments({ businessId, isActive: true }),
      ChatModel.countDocuments({ businessId }),
      OrderModel.countDocuments({ businessId }),
      FaqModel.countDocuments({ businessId }),
      ProductModel.countDocuments({ businessId, isActive: true }),
      FaqModel.countDocuments({ businessId, isActive: true }),
      ChatModel.distinct('customerPhone', { businessId }),
      ChatModel.find({ businessId }).sort({ updatedAt: -1 }).limit(5).select('customerName customerPhone lastMessage updatedAt'),
      OrderModel.find({ businessId }).sort({ createdAt: -1 }).limit(5).select('orderId customerName totalAmount status createdAt'),
      OrderModel.find({ businessId, createdAt: { $gte: start, $lte: end } }),
      ChatModel.find({ businessId, createdAt: { $gte: start, $lte: end } }),
      OrderModel.countDocuments({ businessId, status: 'pending' }),
      OrderModel.countDocuments({ businessId, status: 'completed' }),
      OrderModel.countDocuments({ businessId, status: 'cancelled' })
    ]);

    // Calculate revenue metrics
    const totalRevenue = ordersInRange
      .filter((o: any) => o.status === 'completed')
      .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Get popular products from orders
    const productPopularity: Record<string, { name: string; count: number }> = {};
    for (const order of ordersInRange as any[]) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          const productName = item.productName || 'Unknown Product';
          if (!productPopularity[productName]) {
            productPopularity[productName] = { name: productName, count: 0 };
          }
          productPopularity[productName].count += item.quantity || 1;
        }
      }
    }

    const popularProducts = Object.values(productPopularity)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Group orders and chats by day for trend chart
    const dailyData: Record<string, { orders: number; chats: number; revenue: number }> = {};
    
    // Initialize all days in range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyData[dateKey] = { orders: 0, chats: 0, revenue: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Populate with actual data
    for (const order of ordersInRange as any[]) {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].orders++;
        if (order.status === 'completed') {
          dailyData[dateKey].revenue += order.totalAmount || 0;
        }
      }
    }

    for (const chat of chatsInRange as any[]) {
      const dateKey = new Date(chat.createdAt).toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].chats++;
      }
    }

    const chartData = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        orders: data.orders,
        chats: data.chats,
        revenue: data.revenue
      }));

    return res.json({
      success: true,
      data: {
        summary: {
          // For dashboard totalProducts we also use active products count so it matches the product listing
          totalProducts,
          activeProducts,
          totalChats,
          totalOrders,
          totalFaqs,
          activeFaqs,
          uniqueCustomers: Array.isArray(customerPhones) ? customerPhones.length : 0,
          pendingOrders,
          completedOrders,
          cancelledOrders
        },
        revenue: {
          total: totalRevenue,
          average: averageOrderValue,
          ordersInPeriod: ordersInRange.length,
          completedInPeriod: ordersInRange.filter((o: any) => o.status === 'completed').length
        },
        popularProducts,
        recentChats,
        recentOrders,
        chartData,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      }
    });
  } catch (error: any) {
    console.error('Analytics dashboard error:', error);
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
