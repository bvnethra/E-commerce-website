import mysql from 'mysql2/promise';
import config from './config.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Configure mysql database pool
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Check connectivity on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    logger.info('MySQL Database connected successfully to ' + config.db.host + ':' + config.db.port);
    connection.release();
  } catch (error) {
    logger.error('Database connection failed: ' + error.message);
  }
})();

export default pool;
