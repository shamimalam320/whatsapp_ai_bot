import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getOverview, getChatAnalytics, getSalesAnalytics } from '../controllers/analytics.controller';

const router = Router();

// @route   GET /api/analytics/overview
// @desc    Get dashboard overview stats (counts)
// @access  Private
router.get('/overview', authenticate, getOverview);

// @route   GET /api/analytics/chats
// @desc    Get chat analytics
// @access  Private
router.get('/chats', authenticate, getChatAnalytics);

// @route   GET /api/analytics/sales
// @desc    Get sales analytics
// @access  Private
router.get('/sales', authenticate, getSalesAnalytics);

export default router;
