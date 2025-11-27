import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import User from '../models/User';
import Business from '../models/Business';
import { logger } from '../utils/logger';
import { emailService } from '../utils/emailService';

// Generate JWT Token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register new seller
// @access  Public
export const register = async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password, name, businessName, phone, templateId } = req.body;

    console.log('Registration attempt:', { email, name, businessName, phone: phone ? 'provided' : 'not provided' });

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    console.log('Creating new user...');
    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      email: email.toLowerCase(),
      password, // Don't hash here - let the model's pre-save hook do it
      name,
      phone: phone || '', // Provide empty string if not given
    });
    console.log('User created:', user._id);

    console.log('Creating business...');
    // Create business for the user
    const businessPayload: any = {
      name: businessName,
      owner: user._id,
      whatsappNumber: phone || '',
      industry: 'General',
      languages: ['english', 'hindi'],
      settings: {
        language: 'en',
        autoReply: true,
        workingHours: {
          enabled: false,
          start: '09:00',
          end: '18:00',
        },
      },
    };

    if (templateId) {
      // try to apply template at creation
      const TemplateModel = (await import('../models/Template')).default;
      const tmpl = await TemplateModel.findById(templateId);
      if (tmpl) {
        businessPayload.category = tmpl.category || 'general';
        businessPayload.templateConfig = { templateId: tmpl._id, aiPromptOverrides: tmpl.aiConfig?.systemPrompt || '', messageOverrides: tmpl.messageTemplates || {}, workflowOverrides: tmpl.workflows || [] };
      }
    }

    const business = await Business.create(businessPayload);
    console.log('Business created:', business._id);

    // Update user with business reference
    user.businessId = business._id;
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    logger.info(`New user registered: ${email}`);

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(email, name).catch(err => 
      logger.error('Failed to send welcome email:', err)
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          business: {
            id: business._id,
            name: business.name,
          },
        },
      },
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    console.error('Registration error details:', error); // Add console log for debugging
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
export const login = async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    console.log('Login attempt:', { email });

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('businessId');
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please register first.',
      });
    }

    console.log('User found, checking password...');
    console.log('Password exists:', !!user.password);
    
    // Check password using the model's comparePassword method
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    // Generate token
    const token = generateToken(user._id.toString());

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          business: user.businessId,
        },
      },
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
export const getMe = async (req: Request, res: Response) => {
  try {
    // User is attached to request by auth middleware
    const user = await User.findById(req.user?.userId)
      .select('-password')
      .populate('businessId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          business: user.businessId,
        },
      },
    });
  } catch (error: any) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // For security, don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store hashed token and expiry in user document
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // In production, send email with reset link
    // For now, we'll just return the token in the response (REMOVE IN PRODUCTION)
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

    logger.info(`Password reset requested for: ${email}`);
    
    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(user.email, resetUrl);

    res.json({
      success: true,
      message: emailSent 
        ? 'Password reset instructions have been sent to your email.'
        : 'Password reset link generated. Check console (development mode).',
      // REMOVE THIS IN PRODUCTION - only for development
      ...(process.env.NODE_ENV === 'development' && { resetUrl }),
    });
  } catch (error: any) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing password reset',
      error: error.message,
    });
  }
};

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.info(`Password reset successful for: ${user.email}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error: any) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password',
      error: error.message,
    });
  }
};
