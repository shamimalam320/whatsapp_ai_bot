import Queue from 'bull';
import { logger } from '../utils/logger';
import { aiService } from '../services/ai.service';
import { whatsappService } from '../services/whatsapp.service';
import { orderService } from '../services/order.service';
import { workflowService } from '../services/workflow.service';
import Chat from '../models/Chat';

// Create message processing queue
// Configure Redis for Bull. Prefer a full connection URL (e.g. Upstash REDIS_URL)
// and fall back to host/port when a URL isn't provided.
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

let messageQueue: Queue.Queue;

if (process.env.REDIS_URL) {
  // If REDIS_URL is provided (eg. upstash rediss://...), pass it directly
  messageQueue = new Queue('message-processing', process.env.REDIS_URL, {
    defaultJobOptions,
  });
} else {
  // Fallback to individual host/port/password settings (Docker redis service)
  messageQueue = new Queue('message-processing', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    defaultJobOptions,
  });
}

// Process messages
messageQueue.process('process-message', async (job) => {
  const { chatId, messageId, customerPhone, messageText, businessId } = job.data;

  logger.info(`Processing message ${messageId} from ${customerPhone}`);

  try {
    // Get chat with message history
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Load business to inspect AI config (e.g., autoReply)
    const Business = (await import('../models/Business')).default;
    const business = await Business.findById(businessId).select('aiConfig');
    if (!business) {
      throw new Error('Business not found');
    }

    // If autoReply is disabled for this business, skip generating/sending AI reply
    if (business.aiConfig && business.aiConfig.autoReply === false) {
      logger.info(`Auto-reply disabled for business ${businessId}; skipping AI reply.`);
      return { success: true, skipped: true };
    }

    // Evaluate template workflows first (if any)
    try {
      const wfResult = await workflowService.evaluateMessage(businessId.toString(), messageText || '', chat._id.toString());
      if ((wfResult as any).handled) {
        logger.info('Message handled by workflow engine; skipping further processing');
        return { success: true, handledByWorkflow: true };
      }
    } catch (err) {
      logger.error('Workflow engine error:', err);
    }

    // Detect intent
    const intent = await aiService.detectIntent(messageText);
    logger.info(`Detected intent: ${intent.intent} (confidence: ${intent.confidence})`);

    let aiResponse: string;

    // Check if this is an order-related message
    if (intent.intent === 'order' || intent.intent === 'price_inquiry') {
      const orderResponse = await orderService.processOrderMessage(
        messageText,
        chatId,
        customerPhone,
        businessId.toString()
      );

      if (orderResponse) {
        aiResponse = orderResponse;
      } else {
        // Generate normal AI response
        aiResponse = await aiService.generateResponse(
          messageText,
          businessId.toString(),
          chat.messages
        );
      }
    } else {
      // Check if user is in order flow
      const orderResponse = await orderService.processOrderMessage(
        messageText,
        chatId,
        customerPhone,
        businessId.toString()
      );

      if (orderResponse) {
        aiResponse = orderResponse;
      } else {
        // Generate AI response
        aiResponse = await aiService.generateResponse(
          messageText,
          businessId.toString(),
          chat.messages
        );
      }
    }

    logger.info(`AI response generated: ${aiResponse.substring(0, 50)}...`);

    // Send response via WhatsApp
    const sent = await whatsappService.sendMessage(customerPhone, aiResponse);

    if (sent) {
      // Save AI response to chat
      chat.messages.push({
        sender: 'business',
        text: aiResponse,
        timestamp: new Date(),
        status: 'sent',
      } as any);
      chat.lastMessage = aiResponse;
      chat.lastMessageAt = new Date();
      await chat.save();

      logger.info(`AI response sent and saved to chat ${chatId}`);
    }

    return { success: true, messageId, intent: intent.intent };
  } catch (error: any) {
    logger.error('Error processing message:', error);
    throw error;
  }
});

// Handle completed jobs
messageQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed:`, result);
});

// Handle failed jobs
messageQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err.message);
});

// Handle errors
messageQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

logger.info('Message queue initialized');

export default messageQueue;
