import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUploadProducts,
  getCategories,
} from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { body } from 'express-validator';

const router = Router();

// Validation rules
const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
];

// All routes require authentication
router.use(authenticate);

// @route   GET /api/products
// @desc    Get all products for a business
// @access  Private
router.get('/', getProducts);

// @route   GET /api/products/categories
// @desc    Get all categories
// @access  Private
router.get('/categories', getCategories);

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', getProduct);

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', productValidation, createProduct);
// Bulk upload CSV or JSON
router.post('/bulk', authenticate, bulkUploadProducts);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', deleteProduct);

export default router;
