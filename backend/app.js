import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/config.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';

const app = express();

// Set security headers using Helmet
app.use(helmet());

// Configure Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  'http://localhost:3000', // React Customer Portal
  'http://localhost:3001', // React Admin Portal
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or local scripts)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Parsers for JSON and URL-encoded payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply Global Rate Limiting to API requests
app.use('/api', apiLimiter);

// Mount main API router
app.use('/api', apiRouter);

// Base health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Centralized error handler middleware
app.use(errorHandler);

export default app;
