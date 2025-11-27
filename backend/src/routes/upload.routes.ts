import { Router } from 'express';
import { uploadImage, uploadMiddleware } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protected image upload (multipart/form-data)
router.post('/image', authenticate, uploadMiddleware.single('image'), uploadImage);

export default router;
