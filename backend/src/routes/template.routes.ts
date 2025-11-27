import { Router } from 'express';
import { listTemplates, getTemplate, seedTemplates } from '../controllers/template.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public: list templates
router.get('/', listTemplates);
router.get('/:id', getTemplate);

// Protected: seed templates (admin/dev only)
router.post('/seed', authenticate, seedTemplates);

export default router;
