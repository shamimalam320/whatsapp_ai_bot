import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req: Request, file: any, cb: (err: any, dest?: string) => void) { cb(null, uploadsDir); },
  filename: function (req: Request, file: any, cb: (err: any, filename?: string) => void) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${base}_${Date.now()}${ext}`);
  }
});

export const uploadMiddleware = multer({ storage });

export const uploadImage = async (req: Request & { file?: any }, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    // Build an absolute URL that points to the backend's /uploads route so external webhooks (Twilio) can fetch the image
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = req.get('host') || (process.env.BACKEND_URL ? process.env.BACKEND_URL.replace(/^https?:\/\//, '') : 'localhost:5000');
    const base = process.env.BACKEND_URL ? process.env.BACKEND_URL : `${proto}://${host}`;
    const url = `${base.replace(/\/$/, '')}/uploads/${req.file.filename}`;
    res.json({ success: true, data: { filename: req.file.filename, url } });
  } catch (error: any) {
    logger.error('Image upload error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
