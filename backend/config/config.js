import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'password',
    name: process.env.DB_NAME || 'aura_ecommerce',
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretjwtkeyforauraenterpriseplatform2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkeyforauraenterpriseplatform2026',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholderkey',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'placeholderkeysecret',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'webhooksecret',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  },
  notifications: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525', 10),
      user: process.env.SMTP_USER || 'mockuser',
      password: process.env.SMTP_PASS || 'mockpass',
      from: process.env.SMTP_FROM || 'noreply@aura.com',
    },
    smsKey: process.env.SMS_API_KEY || 'mock-sms-key',
    whatsappKey: process.env.WHATSAPP_API_KEY || 'mock-whatsapp-key',
  }
};

export default config;
