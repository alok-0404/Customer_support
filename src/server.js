/**
 * Customer Support Backend Server
 * 
 * Quickstart:
 * 1. npm install
 * 2. Update .env with your MongoDB URI and SMTP settings (optional)
 * 3. npm run dev (development) or npm start (production)
 * 
 * Features:
 * - MongoDB integration with Mongoose
 * - Email notifications (if SMTP configured)
 * - Rate limiting on contact form
 * - Input validation with Zod
 * - Security headers with Helmet
 * - Request logging with Morgan
 * - CORS support
 * - Graceful error handling
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['PORT', 'MONGO_URI', 'CORS_ORIGIN'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Import database connection
import connectDB from './config/db.js';

// Import routes
import contactRoutes from './routes/contact.routes.js';
import configRoutes from './routes/config.routes.js';
import updatesRoutes from './routes/updates.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import healthRoutes from './routes/health.routes.js';

// Import middleware
import { notFound, errorHandler } from './middlewares/error.js';
import { apiRateLimit } from './middlewares/rateLimit.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('tiny'));

// Rate limiting
app.use('/api', apiRateLimit);

// API Routes
app.use('/api/contact', contactRoutes);
app.use('/api/config', configRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/go/whatsapp', whatsappRoutes);
app.use('/healthz', healthRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Customer Support API',
    version: '1.0.0',
    endpoints: {
      contact: 'POST /api/contact',
      config: 'GET /api/config/support',
      updates: 'GET /api/updates',
      health: 'GET /healthz'
    }
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  if (process.env.SMTP_HOST) {
    console.log('📧 Email notifications enabled');
  } else {
    console.log('📧 Email notifications disabled (SMTP_HOST not configured)');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;