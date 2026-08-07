import Redis from 'ioredis';
import config from './config.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

let redisClient;
let isRedisConnected = false;

try {
  redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null, // Critical for BullMQ
    lazyConnect: true // Prevent immediate crash if offline
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    logger.info(`Redis connected successfully to ${config.redis.host}:${config.redis.port}`);
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    logger.warn(`Redis Connection Warning: ${err.message}. Caching will be bypassed.`);
  });

  // Trigger connection
  redisClient.connect().catch(err => {
    logger.warn(`Redis initial connect failed: ${err.message}. Backend running in local-only fallback.`);
  });
} catch (error) {
  logger.error(`Failed to initialize Redis client: ${error.message}`);
}

export { redisClient, isRedisConnected };
export default redisClient;
