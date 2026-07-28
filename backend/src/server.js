const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');
const logger = require('./config/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const schedulerService = require('./services/scheduler.service');
const { seedDemoUsers } = require('./utils/seeder');
const Settings = require('./models/Settings.model');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5174'];

const isLocalhostOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isLocalhostOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy does not allow access from origin ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan: concise format, pipe into Winston
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: { write: (message) => logger.info(message.trim()) },
  skip: (req) => req.url === '/health', // skip health-check noise
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter for login
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
});

app.use(`/api/${API_VERSION}/auth/login`, authLimiter);
app.use(`/api/${API_VERSION}`, generalLimiter);

// Health check endpoint
app.get('/', async (req, res) => {
  let companyName = 'SVR Food Production';
  try {
    companyName = await Settings.getCompanyName();
  } catch {}
  res.status(200).json({
    success: true,
    message: `${companyName} Management System - Backend API`,
    version: API_VERSION,
    endpoints: {
      health: '/health',
      api: `/api/${API_VERSION}`,
      docs: 'See README.md for API documentation'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  let companyName = 'SVR Food Production';
  try {
    companyName = await Settings.getCompanyName();
  } catch {}
  res.status(200).json({
    success: true,
    message: `${companyName} Management System - Backend is running`,
    timestamp: new Date().toISOString()
  });
});

// API Routes - All Business Routes (Auth, Customers, Workers, Sales, etc.)
app.use(`/api/${API_VERSION}`, require('./routes/business.routes'));

// Export Management Routes
app.use(`/api/${API_VERSION}/exports`, require('./routes/export.routes'));

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Seed demo users for local development if missing
    await seedDemoUsers();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);

      // Start export scheduler
      if (process.env.ENABLE_SCHEDULER !== 'false') {
        schedulerService.start();
        logger.info(`⏰ Export scheduler started`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
