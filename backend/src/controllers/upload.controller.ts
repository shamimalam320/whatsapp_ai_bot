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

    // Prevent path traversal and encoded traversal attacks.
    // Note: naive checks for '..' or '/' are insufficient because
    // - attackers may send URL-encoded sequences (e.g. '%2e%2e' or '%2f') which decode to '../' or '/'
    // - Windows may use backslashes (\) as path separators
    // Use decodeURIComponent + path.basename to ensure we only accept the filename component,
    // and enforce a tight whitelist of allowed filename characters.
    let safeFilename: string;
    try {
      // Decode first to catch encoded traversal like '%2e%2e' -> '..'
      const decoded = decodeURIComponent(filename);
      // Use path.basename to strip any directory components and then enforce
      // a strict whitelist. Using the basename here is important because an
      // attacker might include path separators or encoded sequences that
      // would otherwise bypass simple substring checks.
      const base = path.basename(decoded);
      const hasTraversal = decoded !== base || decoded.includes('..') || decoded.includes('/') || decoded.includes('\\');
      const whitelist = /^[a-zA-Z0-9._-]+$/; // allow only safe filename characters
      if (hasTraversal || !whitelist.test(base)) {
        return res.status(400).json({ success: false, message: 'Invalid filename' });
      }
      safeFilename = base;
    } catch (err) {
      // decodeURIComponent may throw on malformed input — treat as invalid
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    // Resolve the target path using the sanitized filename to ensure we
    // never join attacker-controlled input directly into a path.
    const filePath = path.join(uploadsDir, safeFilename);
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
