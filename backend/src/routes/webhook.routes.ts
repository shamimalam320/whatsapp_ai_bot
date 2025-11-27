import { Router } from 'express';
import {
  receiveWhatsAppMessage,
  receiveWhatsAppStatus,
  testWebhook,
} from '../controllers/webhook.controller';

const router = Router();

// @route   POST /api/webhook/whatsapp
// @desc    Receive WhatsApp messages from Twilio
// @access  Public (validated by Twilio signature)
router.post('/whatsapp', receiveWhatsAppMessage);

// @route   POST /api/webhook/whatsapp/status
// @desc    Receive message status updates
// @access  Public (validated by Twilio signature)
router.post('/whatsapp/status', receiveWhatsAppStatus);

// @route   GET /api/webhook/test
// @desc    Test webhook endpoint
// @access  Public
router.get('/test', testWebhook);
router.post('/test', testWebhook);

export default router;
