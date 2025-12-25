import { Request, Response } from 'express';
import Faq from '../models/Faq';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export const listFaqs = async (req: Request, res: Response) => {
  try {
    // Use authenticated user's businessId for data isolation
    const authenticatedBusinessId = (req as any).user?.businessId;
    const { onlyActive } = req.query;
    
    const filter: any = {};
    
    // CRITICAL: Only show FAQs belonging to the authenticated user's business
    if (authenticatedBusinessId) {
      // businessId is already an ObjectId from auth middleware, use it directly
      filter.businessId = authenticatedBusinessId;
    } else {
      // If no businessId, return empty array (security measure)
      return res.json({ success: true, data: [] });
    }
    
    if (onlyActive === 'true') filter.isActive = true;
    if (onlyActive === 'false') filter.isActive = false;
    
    const faqs = await Faq.find(filter).sort({ createdAt: -1 });
    
    res.json({ success: true, data: faqs });
  } catch (error: any) {
    logger.error('Error listing FAQs', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFaq = async (req: Request, res: Response) => {
  try {
    const { question, answer, isActive } = req.body;
    // Get authenticated user's businessId
    const businessId = (req as any).user?.businessId;
    
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID not found. Please login again.' });
    }
    
    // Check for duplicate question+answer combination
    const existingFaq = await Faq.findOne({
      businessId,
      question: question.trim(),
      answer: answer.trim()
    });
    
    if (existingFaq) {
      return res.status(400).json({ success: false, message: 'FAQ with same question and answer already exists' });
    }
    
    // Default to active=true when isActive is not provided
    const activeFlag = typeof isActive === 'undefined' ? true : !!isActive;
    
    const faq = await Faq.create({ 
      businessId, 
      question, 
      answer, 
      isActive: activeFlag 
    });
    
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
    const authenticatedBusinessId = (req as any).user?.businessId;
    
    // Security: Verify FAQ belongs to authenticated user's business
    const existingFaq = await Faq.findById(id);
    if (!existingFaq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    if (existingFaq.businessId?.toString() !== authenticatedBusinessId?.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot update FAQ from another business' });
    }
    
    const faq = await Faq.findByIdAndUpdate(id, { $set: updates }, { new: true });
    res.json({ success: true, data: faq });
  } catch (error: any) {
    logger.error('Error updating FAQ', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authenticatedBusinessId = (req as any).user?.businessId;
    
    // Security: Verify FAQ belongs to authenticated user's business
    const existingFaq = await Faq.findById(id);
    if (!existingFaq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    if (existingFaq.businessId?.toString() !== authenticatedBusinessId?.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot delete FAQ from another business' });
    }
    
    const faq = await Faq.findByIdAndDelete(id);
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
      { question: 'What are your store hours?', answer: 'We are open 9am-9pm daily' },
      { question: 'What payment methods do you accept?', answer: 'We accept COD and online payments' },
    ];
    await Faq.insertMany(samples as any);
    res.json({ success: true, message: 'Seeded FAQs' });
  } catch (error: any) {
    logger.error('Error seeding FAQs', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk import FAQs from CSV
export const bulkImportFaqs = async (req: Request, res: Response) => {
  try {
    const { faqs } = req.body; // Array of { question, answer, isActive? }
    if (!Array.isArray(faqs) || faqs.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty FAQ data' });
    }

    const businessId = (req as any).user?.businessId || null;
    const created: any[] = [];
    const errors: any[] = [];
    const skipped: any[] = [];

    for (let i = 0; i < faqs.length; i++) {
      const item = faqs[i];
      try {
        if (!item.question || !item.answer) {
          errors.push({ row: i + 1, error: 'Missing question or answer' });
          continue;
        }

        const questionTrimmed = item.question.trim();
        const answerTrimmed = item.answer.trim();
        
        // Check for duplicate
        const existingFaq = await Faq.findOne({
          businessId,
          question: questionTrimmed,
          answer: answerTrimmed
        });
        
        if (existingFaq) {
          skipped.push({ row: i + 1, question: questionTrimmed, reason: 'Duplicate' });
          continue;
        }

        const faqData: any = {
          businessId,
          question: questionTrimmed,
          answer: answerTrimmed,
          isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
        };

        const faq = await Faq.create(faqData);
        created.push(faq);
      } catch (err: any) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Imported ${created.length} FAQs${skipped.length > 0 ? `, skipped ${skipped.length} duplicates` : ''}`,
      data: { created: created.length, errors: errors.length, skipped: skipped.length, errorDetails: errors, skippedDetails: skipped },
    });
  } catch (error: any) {
    logger.error('Error bulk importing FAQs', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
