import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Product from '../models/Product';
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

    res.json({
      success: true,
      data: {
        products,
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

    res.json({
      success: true,
      data: product,
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

    const product = await Product.create({
      ...req.body,
      businessId,
    });

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
      const images = row.images ? row.images.split(';').map((s: string) => s.trim()).filter(Boolean) : [];
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

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
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
