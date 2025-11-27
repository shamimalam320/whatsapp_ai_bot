import { Router } from 'express';
import {
  getChats,
  getChat,
  sendMessage,
  updateChatStatus,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/chats
// @desc    Get all chats for a business
// @access  Private
router.get('/', getChats);

// @route   GET /api/chats/:id
// @desc    Get single chat with messages
// @access  Private
router.get('/:id', getChat);

// @route   POST /api/chats/:id/messages
// @desc    Send message to customer
// @access  Private
router.post('/:id/messages', sendMessage);

// @route   PUT /api/chats/:id/status
// @desc    Update chat status
// @access  Private
router.put('/:id/status', updateChatStatus);

export default router;
