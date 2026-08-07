import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient, isRedisConnected } from '../config/redis.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Configure Rate Limiter middleware
const configureLimiter = (maxRequests, windowMs) => {
  let store;

  if (isRedisConnected && redisClient) {
    try {
      store = new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
      });
      logger.info('Rate limiter initialized with Redis store');
    } catch (err) {
      logger.warn('Failed to configure Redis rate limit store, falling back to local memory');
    }
  }

  return rateLimit({
    windowMs: windowMs || 15 * 60 * 1000, // default 15 minutes
    max: maxRequests || 100, // limit each IP requests
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    store: store, // Fall back to MemoryStore if store is null
    message: {
      status: 'error',
      statusCode: 429,
      message: 'Too many requests from this IP, please try again later.'
    }
  });
};

export const apiLimiter = configureLimiter(200, 15 * 60 * 1000); // 200 requests per 15 mins for generic APIs
export const authLimiter = configureLimiter(20, 15 * 60 * 1000);   // 20 requests per 15 mins for auth routes
export default apiLimiter;
