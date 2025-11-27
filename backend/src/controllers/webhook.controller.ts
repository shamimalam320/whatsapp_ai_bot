import { Request, Response } from 'express';
import twilio from 'twilio';
import Chat from '../models/Chat';
import Business from '../models/Business';
import { logger } from '../utils/logger';
import messageQueue from '../jobs/messageQueue';
import { getIo } from '../utils/socket';

// Verify Twilio signature for security
const validateTwilioRequest = (req: Request): boolean => {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  // Skip validation in development or if NODE_ENV is not production
  if (!authToken || process.env.NODE_ENV === 'development') return true;

  const twilioSignature = req.headers['x-twilio-signature'] as string;
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  return twilio.validateRequest(authToken, twilioSignature, url, req.body);
};

// @route   POST /api/webhook/whatsapp
// @desc    Receive WhatsApp messages from Twilio
// @access  Public (but validated)
export const receiveWhatsAppMessage = async (req: Request, res: Response) => {
  try {
    logger.info('🔔 Webhook hit! Headers:', {
      'x-twilio-signature': req.headers['x-twilio-signature'],
      'content-type': req.headers['content-type'],
      path: req.path,
      originalUrl: req.originalUrl,
    });
    logger.info('🔔 Webhook body:', req.body);

    // Validate request is from Twilio
    if (!validateTwilioRequest(req)) {
      logger.warn('⚠️ Invalid Twilio signature');
      return res.status(403).send('Forbidden');
    }

    const {
      From,
      To,
      Body,
      MessageSid,
      NumMedia,
      MediaUrl0,
      MediaContentType0,
      ProfileName,
    } = req.body;

    logger.info('✅ Received WhatsApp message:', {
      from: From,
      to: To,
      body: Body,
      messageSid: MessageSid,
    });

    // Extract phone number (remove whatsapp: prefix)
    const customerPhone = From.replace('whatsapp:', '');
    const businessPhone = To; // Keep the whatsapp: prefix for database lookup

    logger.info('🔍 Looking for business with WhatsApp number:', businessPhone);

    // Find business by WhatsApp number
    const business = await Business.findOne({ whatsappNumber: businessPhone });
    if (!business) {
      logger.warn(`❌ No business found for WhatsApp number: ${businessPhone}`);
      logger.info('💡 Please update your business with: POST /api/business/whatsapp/connect');
      return res.status(200).send('OK');
    }

    logger.info(`✅ Business found: ${business.name} (ID: ${business._id})`);

    // Find or create chat
    let chat = await Chat.findOne({
      businessId: business._id,
      customerPhone,
      status: { $ne: 'closed' },
    });

    if (!chat) {
      chat = await Chat.create({
        businessId: business._id,
        customerPhone,
        customerName: ProfileName || 'Unknown',
        messages: [],
        status: 'active',
        platform: 'whatsapp',
      });
      logger.info(`New chat created for ${customerPhone}`);
    }

    // Build message object
    const messageObj: any = {
      sender: 'customer',
      text: Body || '',
      timestamp: new Date(),
      messageId: MessageSid,
      status: 'received',
    };

    // Handle media if present
    if (NumMedia && parseInt(NumMedia) > 0) {
      messageObj.mediaUrl = MediaUrl0;
      messageObj.mediaType = MediaContentType0;
    }

    // Add message to chat
    chat.messages.push(messageObj);
    chat.lastMessage = Body || '[Media]';
    chat.lastMessageAt = new Date();
    await chat.save();

    // Emit real-time event to business room
    try {
      const io = getIo();
      if (io) io.to(business._id.toString()).emit('chat.new', { chatId: chat._id, message: messageObj });
    } catch (err) {
      logger.error('Failed to emit chat.new', err);
    }

    // Add to message queue for AI processing
    await messageQueue.add('process-message', {
      chatId: chat._id,
      messageId: MessageSid,
      customerPhone,
      messageText: Body,
      businessId: business._id,
    });

    logger.info(`Message queued for processing: ${MessageSid}`);

    // Respond to Twilio (required within 15 seconds)
    res.status(200).send('OK');
  } catch (error: any) {
    logger.error('Error processing WhatsApp message:', error);
    res.status(500).send('Internal Server Error');
  }
};

// @route   POST /api/webhook/whatsapp/status
// @desc    Receive message status updates
// @access  Public (but validated)
export const receiveWhatsAppStatus = async (req: Request, res: Response) => {
  try {
    const { MessageSid, MessageStatus, To } = req.body;

    logger.info('WhatsApp status update:', {
      messageSid: MessageSid,
      status: MessageStatus,
      to: To,
    });

    // Update message status in database
    const customerPhone = To.replace('whatsapp:', '');
    const chat = await Chat.findOne({
      customerPhone,
      'messages.messageId': MessageSid,
    });

    if (chat) {
      const message = chat.messages.find((msg: any) => msg.messageId === MessageSid);
      if (message) {
        message.status = MessageStatus;
        await chat.save();
      }
    }

    res.status(200).send('OK');
  } catch (error: any) {
    logger.error('Error processing WhatsApp status:', error);
    res.status(500).send('Internal Server Error');
  }
};

// @route   POST /api/webhook/whatsapp/test
// @desc    Test webhook endpoint
// @access  Public
export const testWebhook = async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Webhook is working!',
    timestamp: new Date().toISOString(),
  });
};
