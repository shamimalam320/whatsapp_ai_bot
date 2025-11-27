import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getOrderStats,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/orders/stats
// @desc    Get order statistics
// @access  Private
router.get('/stats', getOrderStats);

// @route   GET /api/orders
// @desc    Get all orders for a business
// @access  Private
router.get('/', getOrders);

// @route   GET /api/orders/:id
// @desc    Get order details
// @access  Private
router.get('/:id', getOrder);

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', createOrder);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', updateOrderStatus);

export default router;
