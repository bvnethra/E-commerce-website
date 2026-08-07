import express from 'express';
import orderController from '../controllers/order.controller.js';
import verifyToken from '../middlewares/auth.middleware.js';

const router = express.Router();

// PUBLIC Webhook endpoint (must bypass JWT verification)
router.post('/payments/webhook', orderController.handleRazorpayWebhook);

// PUBLIC Coupon validation
router.post('/coupons/validate', orderController.validateCoupon);

// Apply JWT Verification to transactions, carts, and checkout
router.use(verifyToken);

// Shopping Cart operations (Write-through Redis/MySQL)
router.get('/cart', orderController.getCart);
router.post('/cart/items', orderController.addCartItem);
router.put('/cart/items', orderController.updateCartItem);
router.delete('/cart/items', orderController.removeCartItem);
router.post('/cart/merge', orderController.mergeGuestCart);

// Checkout Pipelines
router.post('/checkout/totals', orderController.calculateCheckoutTotals);
router.post('/checkout/place', orderController.placeOrder);

// Payment Gateways (Razorpay)
router.post('/payments/create', orderController.createPayment);
router.post('/payments/verify', orderController.verifyPayment);

// Customer Order histories
router.get('/orders', orderController.getOrderHistory);
router.get('/orders/:id', orderController.getOrderDetails);
router.post('/orders/:id/cancel', orderController.cancelOrder);

export default router;
