import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { logger } from '../utils/logger';
import Business from '../models/Business';

// @route   POST /api/ai/chat
// @desc    Test AI chat (for development/testing)
// @access  Private
export const testAIChat = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const businessId = req.user?.businessId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found',
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Generate AI response
    const response = await aiService.generateResponse(
      message,
      businessId.toString(),
      []
    );

    // Detect intent
    const intent = await aiService.detectIntent(message);

    res.json({
      success: true,
      data: {
        userMessage: message,
        aiResponse: response,
        intent,
        configured: aiService.isServiceConfigured(),
      },
    });
  } catch (error: any) {
    logger.error('Test AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   POST /api/ai/search-products
// @desc    Search products using AI
// @access  Private
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const businessId = req.user?.businessId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found',
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const products = await aiService.searchProducts(query, businessId.toString());

    res.json({
      success: true,
      data: {
        query,
        results: products,
        count: products.length,
      },
    });
  } catch (error: any) {
    logger.error('Product search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   PUT /api/ai/config
// @desc    Update AI configuration
// @access  Private
export const updateAIConfig = async (req: Request, res: Response) => {
  try {
    const { model, temperature, systemPrompt } = req.body;
    const businessId = req.user?.businessId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found',
      });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    // Update AI config
    if (model) business.aiConfig.model = model;
    if (temperature !== undefined) business.aiConfig.temperature = temperature;
    if (systemPrompt) business.aiConfig.systemPrompt = systemPrompt;

    await business.save();

    res.json({
      success: true,
      message: 'AI configuration updated',
      data: business.aiConfig,
    });
  } catch (error: any) {
    logger.error('Update AI config error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/ai/status
// @desc    Get AI service status
// @access  Private
export const getAIStatus = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found',
      });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    res.json({
      success: true,
      data: {
        configured: aiService.isServiceConfigured(),
        config: business.aiConfig,
        status: aiService.isServiceConfigured() ? 'active' : 'development_mode',
      },
    });
  } catch (error: any) {
    logger.error('Get AI status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
