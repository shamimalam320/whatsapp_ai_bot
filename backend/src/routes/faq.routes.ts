import { Router } from 'express';
import { listFaqs, createFaq, updateFaq, deleteFaq, seedFaqs, bulkImportFaqs } from '../controllers/faq.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protected list - requires authentication for business isolation
router.get('/', authenticate, listFaqs);

// Protected CRUD
router.post('/', authenticate, createFaq);
router.put('/:id', authenticate, updateFaq);
router.delete('/:id', authenticate, deleteFaq);

// Bulk import
router.post('/bulk-import', authenticate, bulkImportFaqs);

// Seed (dev/admin)
router.post('/seed', authenticate, seedFaqs);

export default router;
