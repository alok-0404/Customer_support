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
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['PORT', 'MONGO_URI', 'JWT_ACCESS_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Import database connection
import connectDB from './config/db.js';

// Import routes (new minimal set)
import searchRoutes from './routes/search.routes.js';
import branchRoutes from './routes/branches.routes.js';
import userRoutes from './routes/users.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminsRoutes from './routes/admins.routes.js';
import clientsRoutes from './routes/clients.routes.js';

// Import middleware
import { notFound, errorHandler } from './middlewares/error.js';
import { apiRateLimit } from './middlewares/rateLimit.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS middleware with whitelist support
const whitelist = (process.env.CORS_WHITELIST || process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (whitelist.length === 0 || whitelist.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitization & hardening middlewares
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Logging middleware
app.use(morgan('tiny'));

// Rate limiting (apply to public APIs)
app.use(['/search', '/branches', '/users', '/auth/login', '/admins', '/clients'], apiRateLimit);

// API Routes (minimal)
app.use('/search', searchRoutes);
app.use('/branches', branchRoutes);
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/admins', adminsRoutes);
app.use('/clients', clientsRoutes);

// Health endpoint
app.get('/health', (req, res) => {
  return res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'GitHub Actions deployment successful with SSH key fix!'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Customer Support API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      search: 'GET /search?userId=AB123',
      branches: 'GET /branches?page=1&limit=10',
      users: 'GET /users?page=1&limit=10',
      auth: 'POST /auth/login, GET /auth/me, POST /auth/logout',
      admins: 'POST /admins (Root only)',
      clients: 'GET /clients (SubAdmin only)'
    }
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  if (process.env.EMAIL_HOST || process.env.SMTP_HOST) {
    console.log('📧 Email notifications enabled');
  } else {
    console.log('📧 Email notifications disabled (EMAIL_HOST not configured)');
  }
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Exiting to allow clean restart.`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

export default app;