import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_ai_bot';
    
    await mongoose.connect(mongoURI, {
      family: 4, // Force IPv4
      serverSelectionTimeoutMS: 10000,
    });
    
    logger.info('✅ MongoDB connected successfully');
    logger.info(`📊 Database: ${mongoose.connection.db?.databaseName || 'whatsapp_ai_bot'}`);
  } catch (error) {
    logger.warn('⚠️ MongoDB connection failed - starting without database');
    logger.warn('📝 Database operations will not work until connection is established');
    // Don't exit - allow app to start for frontend development
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('❌ MongoDB error:', err);
});

export default connectDB;
