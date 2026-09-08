import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import config from './config';
import { connectDB } from './config/db';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting (100 requests per 15 minutes per IP for API)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api/', limiter);

// Serve uploaded files securely if needed
app.use('/uploads', express.static(config.uploadDir));

// API Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'AI Learning & Study Assistant API',
    status: 'operational',
    version: '1.0.0',
    docs: '/api/health',
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start server if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    // In development mode, auto-seed if database is brand new
    if (config.env === 'development') {
      try {
        const User = (await import('./models/User')).default;
        const count = await User.countDocuments();
        if (count === 0) {
          console.log('🌱 Empty database detected. Auto-populating sample courses and demo user...');
          const { seedDatabase } = await import('./scripts/seed');
          await seedDatabase();
        }
      } catch (seedErr: any) {
        console.warn('[Server] Auto-seed note:', seedErr.message);
      }
    }

    app.listen(config.port, () => {
      console.log(`=========================================`);
      console.log(`🚀 AI Study Assistant Server running on http://localhost:${config.port}`);
      console.log(`📡 Environment: ${config.env}`);
      console.log(`🌐 Client Origin: ${config.clientUrl}`);
      console.log(`🔑 Demo User: demo@studyassistant.ai (password: password123)`);
      console.log(`=========================================`);
    });
  });
}

export default app;
