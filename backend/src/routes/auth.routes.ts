import { Router } from 'express';
import { register, login, getMe, forgotPassword, resetPassword, verifyEmail, resendVerification } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { registerValidation, loginValidation } from '../middleware/validation.middleware';
import { passwordResetRateLimiter, verificationEmailRateLimiter } from '../middleware/emailRateLimit.middleware';

const router = Router();

// @route   POST /api/auth/register
// @desc    Register new seller
// @access  Public
router.post('/register', registerValidation, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, getMe);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', resetPassword);

// @route   GET /api/auth/verify-email
// @desc    Verify email with token
// @access  Public
router.get('/verify-email', verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', verificationEmailRateLimiter, resendVerification);

export default router;
