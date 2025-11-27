import { Router } from 'express';
import {
  testAIChat,
  searchProducts,
  updateAIConfig,
  getAIStatus,
} from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// @route   POST /api/ai/chat
// @desc    Test AI chat
// @access  Private
router.post('/chat', testAIChat);

// @route   POST /api/ai/search-products
// @desc    Search products using AI
// @access  Private
router.post('/search-products', searchProducts);

// @route   PUT /api/ai/config
// @desc    Update AI configuration
// @access  Private
router.put('/config', updateAIConfig);

// @route   GET /api/ai/status
// @desc    Get AI service status
// @access  Private
router.get('/status', getAIStatus);

export default router;
