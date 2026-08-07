import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config/config.js';
import orderRepository from '../repositories/order.repository.js';
import adminRepository from '../repositories/admin.repository.js';
import { redisClient, isRedisConnected } from '../config/redis.js';
import { ApiError } from '../middlewares/error.middleware.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

let razorpayInstance = null;

// Initialize Razorpay SDK
try {
  if (config.razorpay.keyId && config.razorpay.keyId !== 'rzp_test_placeholderkey') {
    razorpayInstance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret
    });
    logger.info('Razorpay SDK initialized successfully');
  } else {
    logger.warn('Razorpay credentials missing or placeholder. Running in Mock/Simulated payment mode.');
  }
} catch (error) {
  logger.error('Failed to initialize Razorpay SDK: ' + error.message);
}

export const paymentService = {
  // Idempotency check: returns true if transaction was already processed
  async checkIdempotency(key) {
    if (isRedisConnected && redisClient) {
      const lockKey = `payment_lock:${key}`;
      const result = await redisClient.set(lockKey, 'locked', 'NX', 'EX', 300); // 5 minutes lock
      return result === null; // True if it WAS already set (failed NX)
    }
    return false; // Bypass check if Redis is down
  },

  async createPaymentOrder(orderId, amount) {
    const orderDetails = await orderRepository.getOrderById(orderId);
    if (!orderDetails) {
      throw new ApiError(404, 'Order not found');
    }

    const amountInPaise = Math.round(amount * 100);

    // If using live Razorpay SDK
    if (razorpayInstance) {
      try {
        const option = {
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_order_${orderId}`,
          notes: {
            orderId: orderId.toString()
          }
        };
        const order = await razorpayInstance.orders.create(option);
        
        // Update payment table with Razorpay Order ID
        await orderRepository.createPayment({
          orderId,
          paymentMethod: 'RAZORPAY',
          amount,
          status: 'PENDING',
          transactionId: order.id
        });

        return {
          gatewayOrderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: config.razorpay.keyId
        };
      } catch (err) {
        logger.error('Razorpay Order creation failed: ' + err.message);
        throw new ApiError(500, 'Payment Gateway communication failed', err);
      }
    }

    // Simulated Mock Gateway
    const mockGatewayId = `rzp_mock_${crypto.randomBytes(8).toString('hex')}`;
    
    await orderRepository.createPayment({
      orderId,
      paymentMethod: 'RAZORPAY_SIMULATED',
      amount,
      status: 'PENDING',
      transactionId: mockGatewayId
    });

    return {
      gatewayOrderId: mockGatewayId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: 'rzp_test_placeholderkey',
      simulated: true
    };
  },

  // Verify signature sent by frontend/webhook
  async verifyPaymentSignature(orderId, { razorpayPaymentId, razorpayOrderId, razorpaySignature }) {
    // If running in Mock Mode
    if (razorpayOrderId.startsWith('rzp_mock_')) {
      await orderRepository.updatePaymentStatus(razorpayOrderId, 'COMPLETED');
      await orderRepository.updateOrderStatus(orderId, 'PROCESSING');
      await orderRepository.createShipment({ orderId, shippingMethod: 'STANDARD', status: 'PENDING' });
      
      const order = await orderRepository.getOrderById(orderId);
      await adminRepository.logAction({ userId: order.user_id, action: 'PAYMENT_COMPLETE', details: `Payment verified for Order: ${orderId}` });
      return { status: 'success', message: 'Payment simulated successfully' };
    }

    // Live verification
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpaySignature) {
      throw new ApiError(400, 'Invalid payment signature verification failed');
    }

    // Apply idempotency check
    const isDuplicate = await this.checkIdempotency(razorpayPaymentId);
    if (isDuplicate) {
      return { status: 'success', message: 'Payment already processed' };
    }

    // Update DB
    await orderRepository.updatePaymentStatus(razorpayOrderId, 'COMPLETED');
    await orderRepository.updateOrderStatus(orderId, 'PROCESSING');

    const order = await orderRepository.getOrderById(orderId);
    await adminRepository.logAction({ userId: order.user_id, action: 'PAYMENT_COMPLETE', details: `Payment verified via Razorpay ID: ${razorpayPaymentId}` });

    return { status: 'success', message: 'Payment verified and order is processing' };
  },

  // Webhook verification & processing
  async handleWebhook(body, signature) {
    if (!signature) {
      throw new ApiError(400, 'Missing webhook signature');
    }

    // Validate Signature
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new ApiError(400, 'Webhook signature validation failed');
    }

    const event = body.event;
    const paymentEntity = body.payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    if (event === 'payment.captured') {
      const isDuplicate = await this.checkIdempotency(paymentId);
      if (isDuplicate) return { processed: true };

      // Update Database Status
      await orderRepository.updatePaymentStatus(razorpayOrderId, 'COMPLETED');
      // Fetch order by razorpay transactionId to transition order state
      const [rows] = await pool.query('SELECT order_id FROM payments WHERE transaction_id = ?', [razorpayOrderId]);
      if (rows.length > 0) {
        await orderRepository.updateOrderStatus(rows[0].order_id, 'PROCESSING');
      }
    } else if (event === 'payment.failed') {
      await orderRepository.updatePaymentStatus(razorpayOrderId, 'FAILED');
    }

    return { processed: true };
  },

  // Refunds API
  async refundPayment(orderId, amount) {
    const payment = await orderRepository.getPaymentByOrderId(orderId);
    if (!payment || payment.status !== 'COMPLETED') {
      throw new ApiError(400, 'No completed payment found to refund');
    }

    // Mock refunds
    if (payment.transactionId.startsWith('rzp_mock_') || !razorpayInstance) {
      await orderRepository.updatePaymentStatus(payment.transactionId, 'REFUNDED');
      await orderRepository.updateOrderStatus(orderId, 'CANCELLED');
      return { status: 'refunded', refundId: `rfnd_mock_${crypto.randomBytes(8).toString('hex')}` };
    }

    // Live Razorpay refund
    try {
      const refund = await razorpayInstance.payments.refund(payment.transactionId, {
        amount: Math.round(amount * 100),
        speed: 'normal',
        notes: {
          orderId: orderId.toString()
        }
      });

      await orderRepository.updatePaymentStatus(payment.transactionId, 'REFUNDED');
      await orderRepository.updateOrderStatus(orderId, 'CANCELLED');

      return { status: 'refunded', refundId: refund.id };
    } catch (err) {
      logger.error('Razorpay refund error: ' + err.message);
      throw new ApiError(500, 'Razorpay refund execution failed', err);
    }
  }
};
export default paymentService;
