import { Router } from 'express';
import { uploadImage, uploadMiddleware, deleteImage } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protected image upload (multipart/form-data)
router.post('/image', authenticate, uploadMiddleware.single('image'), uploadImage);

// Delete an uploaded file by filename (auth required)
router.delete('/:filename', authenticate, deleteImage);

export default router;
