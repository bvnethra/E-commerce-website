import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import config from './config/config.js';
import pool from './config/db.js';
import { redisClient } from './config/redis.js';
import eventEmitter from './events/eventEmitter.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

const server = http.createServer(app);

// Setup Socket.IO Server with CORS
const io = new Server(server, {
  cors: {
    origin: '*', // Allow connections from web portals
    methods: ['GET', 'POST']
  }
});

// Map socket connections
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    const roomName = `user_${userId}`;
    socket.join(roomName);
    logger.info(`User socket connection registered: ID ${userId} joined room ${roomName}`);
  }

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Bind internal application events to Socket.IO real-time delivery
eventEmitter.on('notification.created', ({ userId, notificationId, title, message }) => {
  const roomName = `user_${userId}`;
  io.to(roomName).emit('notification', {
    id: notificationId,
    title,
    message,
    createdAt: new Date()
  });
  logger.info(`Real-time notification emitted to room ${roomName}`);
});

// Start listening
const PORT = config.port;
server.listen(PORT, () => {
  logger.info(`AURA Enterprise API Server listening on port ${PORT} [Mode: ${config.env}]`);
});

// Graceful shutdown handler
const shutdown = async () => {
  logger.info('Shutting down server gracefully...');
  server.close(async () => {
    try {
      // Close database pool
      await pool.end();
      logger.info('MySQL Database pool closed.');

      // Close redis client
      if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed.');
      }

      process.exit(0);
    } catch (err) {
      logger.error('Error during graceful shutdown: ' + err.message);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
