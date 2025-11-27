import twilio from 'twilio';
import { logger } from '../utils/logger';

class WhatsAppService {
  private client: twilio.Twilio | null = null;
  private isConfigured: boolean = false;
  private whatsappNumber: string = '';

  constructor() {
    this.initialize();
  }

  private initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';

    if (!accountSid || !authToken || !this.whatsappNumber) {
      logger.warn('WhatsApp service not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in .env');
      this.isConfigured = false;
      return;
    }

    try {
      this.client = twilio(accountSid, authToken);
      this.isConfigured = true;
      logger.info('WhatsApp service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WhatsApp service:', error);
      this.isConfigured = false;
    }
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.isConfigured || !this.client) {
      logger.warn(`WhatsApp not configured. Would send to ${to}: ${message}`);
      console.log(`\n📱 WHATSAPP MESSAGE (Development Mode):`);
      console.log(`To: ${to}`);
      console.log(`Message: ${message}`);
      console.log('================================\n');
      return true;
    }

    try {
      // Ensure phone number has whatsapp: prefix
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      const messageResponse = await this.client.messages.create({
        from: this.whatsappNumber,
        to: formattedTo,
        body: message,
      });

      logger.info(`WhatsApp message sent: ${messageResponse.sid} to ${to}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send WhatsApp message:', error);
      return false;
    }
  }

  async sendMediaMessage(to: string, message: string, mediaUrl: string): Promise<boolean> {
    if (!this.isConfigured || !this.client) {
      logger.warn(`WhatsApp not configured. Would send media to ${to}: ${message}`);
      console.log(`\n📱 WHATSAPP MEDIA MESSAGE (Development Mode):`);
      console.log(`To: ${to}`);
      console.log(`Message: ${message}`);
      console.log(`Media: ${mediaUrl}`);
      console.log('================================\n');
      return true;
    }

    try {
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      const messageResponse = await this.client.messages.create({
        from: this.whatsappNumber,
        to: formattedTo,
        body: message,
        mediaUrl: [mediaUrl],
      });

      logger.info(`WhatsApp media message sent: ${messageResponse.sid} to ${to}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send WhatsApp media message:', error);
      return false;
    }
  }

  async sendTemplateMessage(to: string, templateData: any): Promise<boolean> {
    // Placeholder for template messages
    logger.info('Template messages to be implemented');
    return true;
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  getWhatsAppNumber(): string {
    return this.whatsappNumber;
  }
}

export const whatsappService = new WhatsAppService();
