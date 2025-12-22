import express, { Application, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth.routes';
import businessRoutes from './routes/business.routes';
import productRoutes from './routes/product.routes';
import chatRoutes from './routes/chat.routes';
import orderRoutes from './routes/order.routes';
import webhookRoutes from './routes/webhook.routes';
import analyticsRoutes from './routes/analytics.routes';
import aiRoutes from './routes/ai.routes';
import templateRoutes from './routes/template.routes';
import faqRoutes from './routes/faq.routes';
import uploadRoutes from './routes/upload.routes';
import locationRoutes from './routes/location.routes';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: {
      connected: mongoose.connection.readyState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/locations', locationRoutes);

// Serve uploaded files
// Ensure correct Content-Type for some uncommon image extensions (e.g., .jfif)
app.use('/uploads', (req: Request, res: Response, next) => {
  try {
    if (/\.jfif$/i.test(req.path)) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
  } catch (e) {
    // ignore
  }
  next();
});
// Allow uploads to be embedded cross-origin (useful in dev where frontend runs on different port)
app.use('/uploads', (req: Request, res: Response, next) => {
  try {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  } catch (e) {}
  next();
});
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Create HTTP server and start with socket.io
const server = http.createServer(app);
import('./utils/socket').then(({ initSocket }) => initSocket(server)).catch(err => {
  logger.warn('Socket init failed during dynamic import', err);
});

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📱 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});

export default app;
