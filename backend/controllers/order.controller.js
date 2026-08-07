import cartService from '../services/cart.service.js';
import checkoutService from '../services/checkout.service.js';
import paymentService from '../services/payment.service.js';
import orderRepository from '../repositories/order.repository.js';
import { ApiError } from '../middlewares/error.middleware.js';

export const orderController = {
  // Shopping Cart
  async getCart(req, res, next) {
    try {
      const cart = await cartService.getCart(req.user.id);
      res.status(200).json({
        status: 'success',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  },

  async addCartItem(req, res, next) {
    try {
      const { productId, variantId, quantity } = req.body;
      const cart = await cartService.addCartItem(req.user.id, { productId, variantId, quantity });
      res.status(200).json({
        status: 'success',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCartItem(req, res, next) {
    try {
      const { productId, variantId, quantity } = req.body;
      const cart = await cartService.updateCartItem(req.user.id, { productId, variantId, quantity });
      res.status(200).json({
        status: 'success',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  },

  async removeCartItem(req, res, next) {
    try {
      const { productId, variantId } = req.body;
      const cart = await cartService.removeCartItem(req.user.id, productId, variantId);
      res.status(200).json({
        status: 'success',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  },

  async mergeGuestCart(req, res, next) {
    try {
      const { guestItems } = req.body;
      const cart = await cartService.mergeGuestCart(req.user.id, guestItems);
      res.status(200).json({
        status: 'success',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  },

  // Coupons
  async validateCoupon(req, res, next) {
    try {
      const { code } = req.body;
      const coupon = await orderRepository.findCouponByCode(code);
      if (!coupon || !coupon.isActive) {
        return next(new ApiError(404, 'Coupon not found or inactive'));
      }
      res.status(200).json({
        status: 'success',
        data: coupon
      });
    } catch (error) {
      next(error);
    }
  },

  // Checkout & Order Placement
  async calculateCheckoutTotals(req, res, next) {
    try {
      const { couponCode, shippingAddressId } = req.body;
      const totals = await checkoutService.calculateTotals(req.user.id, { couponCode, shippingAddressId });
      res.status(200).json({
        status: 'success',
        data: totals
      });
    } catch (error) {
      next(error);
    }
  },

  async placeOrder(req, res, next) {
    try {
      const { couponCode, shippingAddressId, billingAddressId, paymentMethod } = req.body;
      const order = await checkoutService.placeOrder(req.user.id, {
        couponCode,
        shippingAddressId,
        billingAddressId,
        paymentMethod
      });
      res.status(201).json({
        status: 'success',
        message: 'Order placed successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  // Payments Integration
  async createPayment(req, res, next) {
    try {
      const { orderId, amount } = req.body;
      if (!orderId || !amount) {
        return next(new ApiError(400, 'OrderId and amount are required'));
      }
      const paymentOrder = await paymentService.createPaymentOrder(orderId, amount);
      res.status(200).json({
        status: 'success',
        data: paymentOrder
      });
    } catch (error) {
      next(error);
    }
  },

  async verifyPayment(req, res, next) {
    try {
      const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
      if (!orderId || !razorpayOrderId) {
        return next(new ApiError(400, 'OrderId and gateway order details are required'));
      }
      const result = await paymentService.verifyPaymentSignature(orderId, {
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async handleRazorpayWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      await paymentService.handleWebhook(req.body, signature);
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  },

  // Order histories
  async getOrderHistory(req, res, next) {
    try {
      const orders = await orderRepository.getOrdersByUser(req.user.id);
      // Return order list directly as expected by frontend
      res.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  },

  async getOrderDetails(req, res, next) {
    try {
      const order = await orderRepository.getOrderById(req.params.id);
      if (!order) {
        return next(new ApiError(404, 'Order not found'));
      }
      // Check authorization
      const [orderRow] = await import('../config/db.js').then(async m => {
        return await m.default.query('SELECT user_id FROM orders WHERE id = ?', [req.params.id]);
      });
      if (orderRow.length === 0 || orderRow[0].user_id !== req.user.id) {
        return next(new ApiError(403, 'Unauthorized to view this order'));
      }
      res.status(200).json({
        status: 'success',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelOrder(req, res, next) {
    try {
      const orderId = req.params.id;
      const order = await orderRepository.getOrderById(orderId);
      if (!order) {
        return next(new ApiError(404, 'Order not found'));
      }
      
      // Update status to CANCELLED
      await orderRepository.updateOrderStatus(orderId, 'CANCELLED');
      
      // Issue refund if completed payment exists
      try {
        await paymentService.refundPayment(orderId, order.totalAmount);
      } catch (err) {
        // Log refund failure but still cancel order record
      }

      res.status(200).json({
        status: 'success',
        message: 'Order cancelled and refund processed'
      });
    } catch (error) {
      next(error);
    }
  }
};
export default orderController;
