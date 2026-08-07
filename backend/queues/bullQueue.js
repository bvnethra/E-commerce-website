import { Queue, Worker } from 'bullmq';
import config from '../config/config.js';
import { isRedisConnected } from '../config/redis.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

let notificationQueue = null;
let bullWorker = null;

const connection = {
  host: config.redis.host,
  port: config.redis.port
};

// Initialize queues if Redis is connected
if (isRedisConnected) {
  try {
    notificationQueue = new Queue('notificationQueue', { connection });
    logger.info('BullMQ Notification Queue initialized successfully');

    // Define worker to process notification jobs
    bullWorker = new Worker('notificationQueue', async (job) => {
      const { type, data } = job.data;
      logger.info(`BullMQ Worker executing job: ${job.id} type: ${type}`);
      
      // Import notification service dynamically to avoid circular dependencies
      const { notificationService } = await import('../services/notification.service.js');
      
      switch (type) {
        case 'EMAIL':
          await notificationService.dispatchEmailImmediate(data.to, data.subject, data.body);
          break;
        case 'SMS':
          await notificationService.dispatchSMSImmediate(data.to, data.message);
          break;
        case 'WHATSAPP':
          await notificationService.dispatchWhatsAppImmediate(data.to, data.message);
          break;
        default:
          logger.warn(`Unknown job type: ${type}`);
      }
    }, { connection });

    bullWorker.on('failed', (job, err) => {
      logger.error(`BullMQ job ${job.id} failed with error: ${err.message}`);
    });
  } catch (error) {
    logger.warn('Failed to initialize BullMQ. Fallback to direct mock queue.');
  }
}

// Fallback in-memory queue if Redis is down
const fallbackQueue = {
  async add(name, data) {
    logger.info(`[BullMQ FALLBACK] Immediately executing task: ${name}`);
    setTimeout(async () => {
      try {
        const { notificationService } = await import('../services/notification.service.js');
        if (data.type === 'EMAIL') {
          await notificationService.dispatchEmailImmediate(data.data.to, data.data.subject, data.data.body);
        } else if (data.type === 'SMS') {
          await notificationService.dispatchSMSImmediate(data.data.to, data.data.message);
        } else if (data.type === 'WHATSAPP') {
          await notificationService.dispatchWhatsAppImmediate(data.data.to, data.data.message);
        }
      } catch (err) {
        logger.error('Fallback Queue task failed: ' + err.message);
      }
    }, 100);
    return { id: 'mock-id' };
  }
};

const getNotificationQueue = () => {
  return notificationQueue || fallbackQueue;
};

export { getNotificationQueue };
export default getNotificationQueue;
