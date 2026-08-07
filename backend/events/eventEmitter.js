import { EventEmitter } from 'events';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

class AppEventEmitter extends EventEmitter {}

const eventEmitter = new AppEventEmitter();

// Bind generic error handler to avoid process crashes
eventEmitter.on('error', (err) => {
  logger.error('EventEmitter error caught: ' + err.message);
});

export default eventEmitter;
