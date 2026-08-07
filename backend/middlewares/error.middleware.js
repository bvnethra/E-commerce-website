import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

export class ApiError extends Error {
  constructor(statusCode, message, rawError = null) {
    super(message);
    this.statusCode = statusCode;
    this.rawError = rawError;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error({
    message: err.message,
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
    rawError: err.rawError
  });

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, raw: err.rawError })
  });
};
export { logger };
