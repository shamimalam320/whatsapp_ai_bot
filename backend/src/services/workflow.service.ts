import Template from '../models/Template';
import { logger } from '../utils/logger';
import { aiService } from './ai.service';
import { whatsappService } from './whatsapp.service';
import Chat from '../models/Chat';

/**
 * Lightweight workflow runner for template workflows.
 * - Looks up a business template's workflows and checks triggers
 * - For message_contains trigger: checks keywords
 * - Actions are limited for MVP: show_product_candidates (returns and sends a product list), delegate to orderService otherwise
 */

class WorkflowService {
  async evaluateMessage(businessId: string, message: string, chatId: string): Promise<{ handled: boolean } | { handled: true } | { handled: false }> {
    try {
      const tmpl = await Template.findOne({ _id: (await import('../models/Business')).default.findById(businessId).then(b=>b?.templateConfig?.templateId) });
      // If template not found, don't handle
      if (!tmpl) return { handled: false };

      const workflows = tmpl.workflows || [];
      const lower = message.toLowerCase();

      for (const wf of workflows) {
        if (wf.trigger === 'message_contains' && Array.isArray(wf.conditions)) {
          for (const cond of wf.conditions) {
            if (lower.includes(cond.toLowerCase())) {
              logger.info(`Workflow matched (${wf.name}) for business ${businessId} - condition ${cond}`);

              // Handle action show_product_candidates
              if (wf.actions?.includes('show_product_candidates')) {
                // search products and send sample list
                const products = await aiService.searchProducts(message, businessId);
                const msg = products && products.length > 0
                  ? 'Here are some products I found:\n' + products.slice(0,5).map((p:any,i)=>`${i+1}. ${p.name} - ₹${p.price}`).join('\n')
                  : "I couldn't find any matching products right now. Can you try describing it differently?";

                // add to chat and send
                const chat = await Chat.findById(chatId);
                if (chat) {
                  chat.messages.push({ sender: 'business', text: msg, timestamp: new Date(), status: 'sent' } as any);
                  chat.lastMessage = msg;
                  chat.lastMessageAt = new Date();
                  await chat.save();
                }

                await whatsappService.sendMessage((await Chat.findById(chatId))?.customerPhone || '', msg);
                return { handled: true };
              }

              // otherwise allow default flows (orderService will pick up)
              return { handled: false };
            }
          }
        }
      }

      return { handled: false };
    } catch (err: any) {
      logger.error('Workflow evaluation error', err);
      return { handled: false };
    }
  }
}

export const workflowService = new WorkflowService();
