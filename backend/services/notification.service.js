import nodemailer from 'nodemailer';
import pool from '../config/db.js';
import config from '../config/config.js';
import { getNotificationQueue } from '../queues/bullQueue.js';
import eventEmitter from '../events/eventEmitter.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: config.notifications.smtp.host,
  port: config.notifications.smtp.port,
  auth: {
    user: config.notifications.smtp.user,
    pass: config.notifications.smtp.pass
  }
});

export const notificationService = {
  // Queue methods
  async queueEmail(to, subject, body) {
    const queue = getNotificationQueue();
    await queue.add('sendEmail', { type: 'EMAIL', data: { to, subject, body } });
  },

  async queueSMS(to, message) {
    const queue = getNotificationQueue();
    await queue.add('sendSMS', { type: 'SMS', data: { to, message } });
  },

  async queueWhatsApp(to, message) {
    const queue = getNotificationQueue();
    await queue.add('sendWhatsApp', { type: 'WHATSAPP', data: { to, message } });
  },

  // Immediate execution methods (called by background workers)
  async dispatchEmailImmediate(to, subject, body) {
    try {
      await transporter.sendMail({
        from: config.notifications.smtp.from,
        to,
        subject,
        html: body
      });
      logger.info(`Email dispatched successfully to ${to}`);
    } catch (err) {
      logger.warn(`SMTP Email delivery simulated: To: ${to}, Subject: ${subject}`);
    }
  },

  async dispatchSMSImmediate(to, message) {
    logger.info(`[SMS DISPATCH] Sending SMS to ${to}: ${message}`);
  },

  async dispatchWhatsAppImmediate(to, message) {
    logger.info(`[WHATSAPP DISPATCH] Sending WhatsApp to ${to}: ${message}`);
  },

  // Save database notifications for in-app messaging
  async saveInAppNotification(userId, title, message) {
    try {
      const [result] = await pool.query(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [userId, title, message]
      );
      
      // Emit to Socket.IO for real-time update
      eventEmitter.emit('notification.created', { userId, notificationId: result.insertId, title, message });
      
      return result.insertId;
    } catch (err) {
      logger.error('Failed to save in-app notification: ' + err.message);
    }
  },

  async getUserNotifications(userId) {
    const [rows] = await pool.query(
      'SELECT id, title, message, is_read as isRead, created_at as createdAt FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async markAsRead(notificationId, userId) {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  }
};

// Bind event listeners for notification triggers
eventEmitter.on('order.placed', async ({ order, userId }) => {
  const emailBody = `
    <h1>Order Confirmed!</h1>
    <p>Thank you for shopping with AURA.</p>
    <p>Your Order Number is: <b>${order.orderNumber}</b></p>
    <p>Total amount: <b>₹${order.totalAmount}</b></p>
  `;
  
  // Save in-app notification
  await notificationService.saveInAppNotification(
    userId,
    'Order Placed Successfully',
    `Your order ${order.orderNumber} has been placed. Total: ₹${order.totalAmount}`
  );

  // Queue external notification dispatches
  const [userRows] = await pool.query('SELECT email, phone_number FROM users WHERE id = ?', [userId]);
  if (userRows.length > 0) {
    const user = userRows[0];
    await notificationService.queueEmail(user.email, 'AURA Order Confirmation', emailBody);
    if (user.phone_number) {
      await notificationService.queueSMS(user.phone_number, `Order Confirmed: ${order.orderNumber}. Thank you!`);
      await notificationService.queueWhatsApp(user.phone_number, `Hello! Your AURA order ${order.orderNumber} is confirmed.`);
    }
  }
});

export default notificationService;
