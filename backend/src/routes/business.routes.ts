import { Router } from 'express';
import Business from '../models/Business';
import { authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// @route   GET /api/business/profile
// @desc    Get business profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  logger.info('🎯 Inside GET /profile handler');
  try {
    if (!req.user) {
      logger.error('❌ No req.user found');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    logger.info(`🔍 Looking for business with ID: ${req.user.businessId}`);
    logger.info(`👤 User ID: ${req.user.userId}`);
    
    const business = await Business.findById(req.user.businessId);
    // also fetch user to include email/phone
    const User = (await import('../models/User')).default;
    const user = await User.findById(req.user.userId).select('email phone name');

    if (!business) {
      logger.error(`❌ Business not found for ID: ${req.user.businessId}`);
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    logger.info(`✅ Business found: ${business.name}`);

    const merged = {
      _id: business._id,
      name: business.name,
      industry: business.industry,
      category: (business as any).category || 'general',
      templateConfig: (business as any).templateConfig || {},
      address: (business as any).address || '',
      whatsappNumber: business.whatsappNumber,
      email: user?.email || '',
      phone: user?.phone || '',
    };

    res.json({ success: true, data: merged });
  } catch (error: any) {
    logger.error('❌ Error in GET /profile:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/business/profile
// @desc    Update business profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { name, email, phone, address } = req.body;

    // Update business fields (name, address)
    const business = await Business.findByIdAndUpdate(
      req.user.businessId,
      { $set: { name, address } },
      { new: true }
    );

    // Update user fields (email, phone, name)
    const User = (await import('../models/User')).default;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { email, phone, name } },
      { new: true }
    );

    const merged = {
      _id: business?._id,
      name: business?.name,
      industry: business?.industry,
      address: (business as any)?.address || '',
      whatsappNumber: business?.whatsappNumber,
      email: user?.email || '',
      phone: user?.phone || '',
    };

    res.json({ success: true, data: merged });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/business/whatsapp/connect
// @desc    Connect WhatsApp Business number
// @access  Private
router.post('/whatsapp/connect', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { whatsappNumber } = req.body;
    
    if (!whatsappNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'WhatsApp number is required' 
      });
    }

    // Ensure number has whatsapp: prefix
    const formattedNumber = whatsappNumber.startsWith('whatsapp:') 
      ? whatsappNumber 
      : `whatsapp:${whatsappNumber}`;

    const business = await Business.findByIdAndUpdate(
      req.user.businessId,
      { $set: { whatsappNumber: formattedNumber } },
      { new: true }
    );

    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'WhatsApp number connected successfully',
      data: { 
        businessName: business.name,
        whatsappNumber: business.whatsappNumber 
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/business/ai-config
// @desc    Get AI configuration for the business
// @access  Private
router.get('/ai-config', authenticate, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const business = await Business.findById(req.user.businessId).select('aiConfig');
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });

    res.json({ success: true, data: business.aiConfig });
  } catch (error: any) {
    logger.error('❌ Error in GET /ai-config:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/business/ai-config
// @desc    Update AI configuration for the business
// @access  Private
router.put('/ai-config', authenticate, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { model, temperature, systemPrompt, autoReply, tone } = req.body;

    const update: any = {};
    if (model !== undefined) update['aiConfig.model'] = model;
    if (temperature !== undefined) update['aiConfig.temperature'] = temperature;
    if (systemPrompt !== undefined) update['aiConfig.systemPrompt'] = systemPrompt;
    if (autoReply !== undefined) update['aiConfig.autoReply'] = autoReply;
    if (tone !== undefined) update['aiConfig.tone'] = tone;

    const business = await Business.findByIdAndUpdate(
      req.user.businessId,
      { $set: update },
      { new: true }
    ).select('aiConfig');

    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });

    res.json({ success: true, data: business.aiConfig });
  } catch (error: any) {
    logger.error('❌ Error in PUT /ai-config:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/business/ai-settings
// @desc    Get AI settings JSON for the business
// @access  Private
router.get('/ai-settings', authenticate, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const business = await Business.findById(req.user.businessId).select('templateConfig.aiSettings');
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
    res.json({ success: true, data: (business as any).templateConfig?.aiSettings || {} });
  } catch (error: any) {
    logger.error('Error getting ai-settings', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/business/ai-settings
// @desc    Update AI settings JSON for the business
// @access  Private
router.put('/ai-settings', authenticate, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const settings = req.body || {};
    const business = await Business.findByIdAndUpdate(req.user.businessId, { $set: { 'templateConfig.aiSettings': settings } }, { new: true }).select('templateConfig.aiSettings');
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
    res.json({ success: true, data: (business as any).templateConfig?.aiSettings || {} });
  } catch (error: any) {
    logger.error('Error updating ai-settings', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/business/apply-template
// @desc Apply a template to the current business (select template and set category)
// @access Private
router.post('/apply-template', authenticate, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { templateId } = req.body;
    if (!templateId) return res.status(400).json({ success: false, message: 'templateId is required' });

    const TemplateModel = (await import('../models/Template')).default;
    const template = await TemplateModel.findById(templateId);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    const business = await Business.findByIdAndUpdate(req.user.businessId, {
      $set: { category: template.category, 'templateConfig.templateId': template._id, 'templateConfig.aiPromptOverrides': template.aiConfig?.systemPrompt }
    }, { new: true });

    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });

    res.json({ success: true, message: 'Template applied', data: { businessId: business._id, category: business.category } });
  } catch (error: any) {
    logger.error('Error applying template', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
