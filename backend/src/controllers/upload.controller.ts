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
    // Build a stable response. Return a relative path so clients can resolve
    // it against their configured API base URL. When BACKEND_URL is configured
    // we also return an absolute url for external systems (webhooks) that
    // might need to fetch the file directly.
    const relPath = `/uploads/${req.file.filename}`;
    const url = process.env.BACKEND_URL ? `${process.env.BACKEND_URL.replace(/\/$/, '')}${relPath}` : relPath;

    res.json({ success: true, data: { filename: req.file.filename, url, path: relPath } });
  } catch (error: any) {
    logger.error('Image upload error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    if (!filename) return res.status(400).json({ success: false, message: 'Filename required' });

    // Prevent path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    await fs.promises.unlink(filePath);
    return res.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    logger.error('Delete image error', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
