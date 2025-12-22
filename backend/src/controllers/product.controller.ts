import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Product from '../models/Product';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

// @route   GET /api/products
// @desc    Get all products for a business
// @access  Private
export const getProducts = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const category = req.query.category as string;

    // Build query
    const query: any = { businessId, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameHindi: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // sanitize image arrays in the response so UI doesn't receive non-image strings
    const sanitizeImages = (arr: any) => {
      if (!Array.isArray(arr)) return [];
      return arr.map((s: any) => (typeof s === 'string' ? s.trim() : '')).filter((s: string) => {
        if (!s) return false;
        if (/^https?:\/\//i.test(s)) return true;
        if (/^\/uploads|^uploads\//i.test(s)) return true;
        if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(s)) return true;
        return false;
      });
    };

    const sanitizedProducts = products.map((p: any) => {
      const doc = p.toObject ? p.toObject() : p;
      const originalImages = doc.images || [];
      doc.images = sanitizeImages(doc.images);
      // Log if we filtered any images (helps debug)
      if (originalImages.length !== doc.images.length) {
        logger.info(`Filtered ${originalImages.length - doc.images.length} invalid images from product ${doc._id}`);
      }
      return doc;
    });

    res.json({
      success: true,
      data: {
        products: sanitizedProducts,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error: any) {
    logger.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if product belongs to user's business
    if (product.businessId.toString() !== req.user?.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // ensure result includes only valid image urls/paths
    const sanitizeImages = (arr: any) => {
      if (!Array.isArray(arr)) return [];
      return arr.map((s: any) => (typeof s === 'string' ? s.trim() : '')).filter((s: string) => {
        if (!s) return false;
        if (/^https?:\/\//i.test(s)) return true;
        if (/^\/uploads|^uploads\//i.test(s)) return true;
        if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(s)) return true;
        return false;
      });
    };

    const out = product.toObject ? product.toObject() : product;
    out.images = sanitizeImages(out.images);

    res.json({
      success: true,
      data: out,
    });
  } catch (error: any) {
    logger.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   POST /api/products
// @desc    Create new product
// @access  Private
export const createProduct = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const businessId = req.user?.businessId;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found',
      });
    }

    // sanitize images array - accept absolute urls, /uploads paths, or filenames with image extensions
    const sanitizeImages = (arr: any) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((v: any) => typeof v === 'string')
        .map((s: string) => s.trim())
        .filter((s: string) => {
          if (!s) return false;
          if (/^https?:\/\//i.test(s)) return true;
          if (/^\/uploads|^uploads\//i.test(s)) return true;
          if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(s)) return true;
          return false;
        });
    };

    const payload = { ...req.body, businessId } as any;
    if (payload.images) payload.images = sanitizeImages(payload.images);

    const product = await Product.create(payload);

    logger.info(`Product created: ${product.name} by business ${businessId}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error: any) {
    logger.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// POST /api/products/bulk
// Accepts { csv: string } or { products: [{...}] }
export const bulkUploadProducts = async (req: Request, res: Response) => {
  try {
    // Ensure authenticated and have businessId
    const user: any = (req as any).user;
    if (!user || !user.businessId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const businessId = user.businessId;

    const { csv, products } = req.body;
    let parsed: any[] = [];

    if (Array.isArray(products)) {
      parsed = products;
    } else if (typeof csv === 'string') {
      // Better CSV parser: handles quoted fields and commas inside quotes
      // Split lines respecting CRLF and LF and ignore empty lines
      const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return res.status(400).json({ success: false, message: 'CSV must include header and at least one row' });

      // Headers from first line
      const headers = lines[0].match(/(?:\"([^\"]*)\"|[^,])+?/g)?.map(h => h.replace(/^\s*"|"\s*$/g, '').trim().toLowerCase()) || [];

      const splitter = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/; // comma not inside quotes

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(splitter).map(c => c.trim());
        const obj: any = {};
        for (let j = 0; j < headers.length; j++) {
          const key = headers[j];
          let val = cols[j] || '';
          val = val.replace(/^"|"$/g, '');
          obj[key] = val;
        }
        parsed.push(obj);
      }
    } else {
      return res.status(400).json({ success: false, message: 'Provide csv string or products array' });
    }

    // Transform parsed rows to product documents
    const created: any[] = [];
    for (const row of parsed) {
      const price = parseFloat(row.price || '0') || 0;
      const stock = parseInt(row.stock || '0') || 0;
      const rawImages = row.images ? row.images.split(';').map((s: string) => s.trim()).filter(Boolean) : [];
      const images = rawImages.filter((s: string) => {
        if (!s) return false;
        if (/^https?:\/\//i.test(s)) return true;
        if (/^\/uploads|^uploads\//i.test(s)) return true;
        if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(s)) return true;
        return false;
      });
      const variants = [];
      if (row.variants) {
        // variants separated by ; each variant like name:price
        const parts = row.variants.split(';').map((p: string) => p.trim()).filter(Boolean);
        for (const p of parts) {
          const [n, pr] = p.split(':').map((s: string) => s.trim());
          const vprice = parseFloat(pr || '0') || 0;
          if (n) variants.push({ name: n, price: vprice });
        }
      }

      const productDoc = await Product.create({
        businessId,
        name: row.name || 'Untitled',
        nameHindi: row.namehindi || row.nameHindi || '',
        // Ensure description is not empty because schema requires it
        description: (row.description || '').trim() || 'No description provided',
        descriptionHindi: row.descriptionhindi || '',
        price,
        category: row.category || 'general',
        images,
        inStock: row.instock === 'false' ? false : true,
        stock,
        isActive: row.isactive === 'false' ? false : true,
        variants,
      });

      created.push(productDoc);
    }

    res.json({ success: true, inserted: created.length, data: created });
  } catch (error: any) {
    logger.error('Error in bulkUploadProducts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check ownership
    if (product.businessId.toString() !== req.user?.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // sanitize images for updates too
    const updatePayload: any = { ...req.body };
    if (updatePayload.images && Array.isArray(updatePayload.images)) {
      updatePayload.images = updatePayload.images
        .filter((v: any) => typeof v === 'string')
        .map((s: string) => s.trim())
        .filter((s: string) => {
          if (!s) return false;
          if (/^https?:\/\//i.test(s)) return true;
          if (/^\/uploads|^uploads\//i.test(s)) return true;
          if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(s)) return true;
          return false;
        });
    }

    // If the client sent a list of deleted images (strings), attempt to remove those files from disk
    const deletedImages: string[] = Array.isArray(req.body.deletedImages) ? req.body.deletedImages : [];
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    for (const img of deletedImages) {
      try {
        if (!img) continue;
        // If img is full URL, pick filename
        let filename = img;
        try { const u = new URL(img); filename = path.basename(u.pathname); } catch (e) {}
        // Decode and sanitize filename to prevent path traversal and ensure file is within uploads
        let decodedFilename: string;
        try {
          decodedFilename = decodeURIComponent(filename);
        } catch {
          // If decoding fails, skip this entry
          continue;
        }
        // Disallow any path separators or traversal sequences in the filename
        if (!decodedFilename || decodedFilename.includes('..') || decodedFilename.includes('/') || decodedFilename.includes('\\')) {
          continue;
        }
        const filePath = path.resolve(uploadsDir, decodedFilename);
        // Ensure the resolved path is still within the uploads directory
        if (!filePath.startsWith(uploadsDir + path.sep)) {
          continue;
        }
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (e) {
        // Log but don't fail update
        console.warn('Failed to delete file', img, e);
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    logger.info(`Product updated: ${product.name}`);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error: any) {
    logger.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check ownership
    if (product.businessId.toString() !== req.user?.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    logger.info(`Product deleted: ${product.name}`);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/products/categories
// @desc    Get all product categories
// @access  Private
export const getCategories = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const categories = await Product.distinct('category', { businessId, isActive: true });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
