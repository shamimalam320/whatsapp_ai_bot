import { Router } from 'express';
import { listFaqs, createFaq, updateFaq, deleteFaq, seedFaqs } from '../controllers/faq.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public list (optionally filter by business)
router.get('/', listFaqs);

// Protected CRUD
router.post('/', authenticate, createFaq);
router.put('/:id', authenticate, updateFaq);
router.delete('/:id', authenticate, deleteFaq);

// Seed (dev/admin)
router.post('/seed', authenticate, seedFaqs);

export default router;
