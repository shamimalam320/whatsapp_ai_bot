import { Request, Response } from 'express';
import Faq from '../models/Faq';
import { logger } from '../utils/logger';

export const listFaqs = async (req: Request, res: Response) => {
  try {
    // optional query: ?businessId=... or ?category=...
    const { businessId, category, onlyActive } = req.query;
    const filter: any = {};
    if (businessId) filter.businessId = businessId;
    if (category) filter.category = category;
    if (onlyActive === 'true') filter.isActive = true;

    const faqs = await Faq.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: faqs });
  } catch (error: any) {
    logger.error('Error listing FAQs', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFaq = async (req: Request, res: Response) => {
  try {
    const { category, question, answer, isActive } = req.body;
    // Prefer authenticated user's businessId if available
    const businessId = (req as any).user?.businessId || null;
    // Default to active=true when isActive is not provided
    const activeFlag = typeof isActive === 'undefined' ? true : !!isActive;
    const faq = await Faq.create({ businessId: businessId || null, category: category || 'general', question, answer: answer || {}, isActive: activeFlag });
    res.json({ success: true, data: faq });
  } catch (error: any) {
    logger.error('Error creating FAQ', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const faq = await Faq.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.json({ success: true, data: faq });
  } catch (error: any) {
    logger.error('Error updating FAQ', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const faq = await Faq.findByIdAndDelete(id);
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (error: any) {
    logger.error('Error deleting FAQ', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin seed (create example faq templates) - optional
export const seedFaqs = async (req: Request, res: Response) => {
  try {
    const count = await Faq.countDocuments();
    if (count > 0) return res.json({ success: true, message: 'FAQs already exist' });

    const samples = [
      { question: 'What are your store hours?', answer: { en: 'We are open 9am-9pm daily', hi: 'हम रोज़ सुबह 9 बजे से रात 9 बजे तक खुले रहते हैं' }, category: 'general' },
      { question: 'What payment methods do you accept?', answer: { en: 'We accept COD and online payments', hi: 'हम COD और ऑनलाइन पेमेंट स्वीकार करते हैं' }, category: 'payments' },
    ];
    await Faq.insertMany(samples as any);
    res.json({ success: true, message: 'Seeded FAQs' });
  } catch (error: any) {
    logger.error('Error seeding FAQs', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
