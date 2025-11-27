import { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import Chat from '../models/Chat';
import { logger } from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';

// @route   GET /api/orders
// @desc    Get all orders for a business
// @access  Private
export const getOrders = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const query: any = { businessId };
    if (status) {
      query.status = status;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.productId', 'name price');

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error: any) {
    logger.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
export const getOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name nameHindi price images')
      .populate('chatId', 'customerPhone customerName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership
    if (order.businessId.toString() !== req.user?.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    logger.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   POST /api/orders
// @desc    Create order manually from dashboard
// @access  Private
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { customerPhone, customerName, items, deliveryAddress, notes } = req.body;
    const businessId = req.user?.businessId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found',
      });
    }

    if (!customerPhone || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer phone and items are required',
      });
    }

    // Find or create chat
    let chat = await Chat.findOne({
      businessId,
      customerPhone,
      status: { $ne: 'closed' },
    });

    if (!chat) {
      chat = await Chat.create({
        businessId,
        customerPhone,
        customerName: customerName || 'Unknown',
        messages: [],
        status: 'active',
        platform: 'whatsapp',
      });
    }

    // Validate and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.businessId.toString() !== businessId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Product does not belong to your business',
        });
      }

      const quantity = item.quantity || 1;
      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        quantity,
        price: product.price,
      });
    }

    // Create order
    const order = await Order.create({
      businessId,
      chatId: chat._id,
      customerPhone,
      customerName: customerName || chat.customerName,
      items: orderItems,
      totalAmount,
      status: 'pending',
      deliveryAddress,
      notes,
    });

    // Send confirmation message
    const orderSummary = orderItems
      .map((item) => `${item.quantity}x ${item.productName} - ₹${item.price}`)
      .join('\n');

    const confirmationMessage = `✅ Order Confirmed! #${order._id.toString().slice(-6).toUpperCase()}

${orderSummary}

Total: ₹${totalAmount}
${deliveryAddress ? `\nDelivery Address: ${deliveryAddress}` : ''}

We'll notify you when your order is ready for delivery.
Thank you for your order! 🙏`;

    await whatsappService.sendMessage(customerPhone, confirmationMessage);

    logger.info(`Order created: ${order._id}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error: any) {
    logger.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership
    if (order.businessId.toString() !== req.user?.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    // Send status update message
    let statusMessage = '';
    switch (status) {
      case 'confirmed':
        statusMessage = `✅ Your order #${order._id.toString().slice(-6).toUpperCase()} has been confirmed! We're preparing it for you.`;
        break;
      case 'completed':
        statusMessage = `🎉 Your order #${order._id.toString().slice(-6).toUpperCase()} has been completed! Thank you for your business!`;
        break;
      case 'cancelled':
        statusMessage = `❌ Your order #${order._id.toString().slice(-6).toUpperCase()} has been cancelled. If you have any questions, please contact us.`;
        break;
    }

    if (statusMessage && oldStatus !== status) {
      await whatsappService.sendMessage(order.customerPhone, statusMessage);
    }

    logger.info(`Order ${order._id} status updated to ${status}`);

    res.json({
      success: true,
      message: 'Order status updated',
      data: order,
    });
  } catch (error: any) {
    logger.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/orders/stats
// @desc    Get order statistics
// @access  Private
export const getOrderStats = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found',
      });
    }

    const [totalOrders, pendingOrders, completedOrders, revenue] = await Promise.all([
      Order.countDocuments({ businessId }),
      Order.countDocuments({ businessId, status: 'pending' }),
      Order.countDocuments({ businessId, status: 'completed' }),
      Order.aggregate([
        { $match: { businessId, status: { $in: ['completed', 'confirmed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: revenue[0]?.total || 0,
      },
    });
  } catch (error: any) {
    logger.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
