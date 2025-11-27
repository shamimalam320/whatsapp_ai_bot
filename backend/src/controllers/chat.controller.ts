import { Request, Response } from 'express';
import Chat from '../models/Chat';
import { logger } from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';

// @route   GET /api/chats
// @desc    Get all chats for a business
// @access  Private
export const getChats = async (req: Request, res: Response) => {
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

    const total = await Chat.countDocuments(query);
    const chats = await Chat.find(query)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-messages'); // Don't include all messages in list

    res.json({
      success: true,
      data: {
        chats,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error: any) {
    logger.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/chats/:id
// @desc    Get single chat with all messages
// @access  Private
export const getChat = async (req: Request, res: Response) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Check if chat belongs to user's business
    if (chat.businessId.toString() !== req.user?.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error: any) {
    logger.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   POST /api/chats/:id/messages
// @desc    Send message to customer
// @access  Private
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message, mediaUrl } = req.body;

    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Check ownership
    if (chat.businessId.toString() !== req.user?.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Send via WhatsApp
    const sent = mediaUrl
      ? await whatsappService.sendMediaMessage(chat.customerPhone, message, mediaUrl)
      : await whatsappService.sendMessage(chat.customerPhone, message);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send message',
      });
    }

    // Save to database
    const messageObj: any = {
      sender: 'business' as 'business',
      text: message,
      timestamp: new Date(),
      status: 'sent',
      mediaUrl,
    };

    chat.messages.push(messageObj);
    chat.lastMessage = message;
    chat.lastMessageAt = new Date();
    await chat.save();

    logger.info(`Message sent to ${chat.customerPhone}`);

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: messageObj,
    });
  } catch (error: any) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   PUT /api/chats/:id/status
// @desc    Update chat status
// @access  Private
export const updateChatStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    if (chat.businessId.toString() !== req.user?.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    chat.status = status;
    await chat.save();

    res.json({
      success: true,
      message: 'Chat status updated',
      data: chat,
    });
  } catch (error: any) {
    logger.error('Update chat status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
