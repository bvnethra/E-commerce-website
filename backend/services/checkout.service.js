import orderRepository from '../repositories/order.repository.js';
import productRepository from '../repositories/product.repository.js';
import cartService from './cart.service.js';
import adminRepository from '../repositories/admin.repository.js';
import eventEmitter from '../events/eventEmitter.js';
import { ApiError } from '../middlewares/error.middleware.js';

export const checkoutService = {
  async calculateTotals(userId, { couponCode = null, shippingAddressId = null } = {}) {
    const cartItems = await cartService.getCart(userId);
    if (cartItems.length === 0) {
      throw new ApiError(400, 'Cannot checkout an empty shopping cart');
    }

    let subtotal = 0;
    const itemsSummary = [];

    // Verify stock and sum prices
    for (const item of cartItems) {
      const inventory = await productRepository.getInventory(item.product.id, item.variant ? item.variant.id : null);
      if (!inventory || inventory.quantity < item.quantity) {
        throw new ApiError(
          400,
          `Item "${item.product.name}" is out of stock. Stock: ${inventory ? inventory.quantity : 0}`
        );
      }
      
      const price = item.product.price;
      subtotal += price * item.quantity;
      itemsSummary.push({
        productId: item.product.id,
        variantId: item.variant ? item.variant.id : null,
        quantity: item.quantity,
        price
      });
    }

    // Coupon logic
    let discount = 0;
    let appliedCouponId = null;
    if (couponCode) {
      const coupon = await orderRepository.findCouponByCode(couponCode);
      if (!coupon || !coupon.isActive) {
        throw new ApiError(400, 'Invalid or inactive discount coupon code');
      }

      // Check dates
      const now = new Date();
      if (coupon.startDate && new Date(coupon.startDate) > now) {
        throw new ApiError(400, 'Coupon campaign has not started yet');
      }
      if (coupon.endDate && new Date(coupon.endDate) < now) {
        throw new ApiError(400, 'Coupon code has expired');
      }

      // Check usage limits
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        throw new ApiError(400, 'Coupon usage limit has been reached');
      }

      // Check minimum purchase amount
      if (subtotal < parseFloat(coupon.minPurchase)) {
        throw new ApiError(400, `Minimum purchase of ₹${coupon.minPurchase} required for this coupon`);
      }

      if (coupon.discountType === 'PERCENTAGE') {
        discount = (subtotal * parseFloat(coupon.discountValue)) / 100;
        if (coupon.maxDiscount !== null && discount > parseFloat(coupon.maxDiscount)) {
          discount = parseFloat(coupon.maxDiscount);
        }
      } else {
        discount = parseFloat(coupon.discountValue);
      }

      appliedCouponId = coupon.id;
    }

    // Shipping calculations (Flat ₹100, free for orders above ₹1500)
    const shipping = subtotal > 1500 ? 0 : 100;

    // Tax calculation (Included or standard GST 18%)
    const gstRate = 0.18;
    const tax = (subtotal - discount) * gstRate;

    const total = subtotal - discount + shipping;

    return {
      subtotal,
      discount,
      shipping,
      tax,
      total,
      appliedCouponId,
      items: itemsSummary
    };
  },

  async placeOrder(userId, { couponCode = null, shippingAddressId = null, billingAddressId = null, paymentMethod = 'COD' }) {
    const totals = await this.calculateTotals(userId, { couponCode, shippingAddressId });

    // 1. Reserve Inventory (subtract stock)
    for (const item of totals.items) {
      const success = await productRepository.updateStock(item.productId, item.variantId, -item.quantity);
      if (!success) {
        throw new ApiError(500, 'Error reserving stock for items during order completion');
      }
    }

    // 2. Create the Order
    const orderId = await orderRepository.createOrder({
      userId,
      totalAmount: totals.total,
      couponId: totals.appliedCouponId,
      shippingAddressId,
      billingAddressId,
      status: paymentMethod === 'COD' ? 'PROCESSING' : 'PENDING'
    });

    // 3. Create Order Items
    for (const item of totals.items) {
      await orderRepository.createOrderItem({
        orderId,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price
      });
    }

    // 4. Update coupon usage count if applied
    if (totals.appliedCouponId) {
      await orderRepository.incrementCouponUsage(totals.appliedCouponId);
    }

    // 5. Clear Cart (Write-through cache logic inside cartService)
    await cartService.clearCart(userId);

    // 6. Record Initial Payment
    await orderRepository.createPayment({
      orderId,
      paymentMethod,
      amount: totals.total,
      status: paymentMethod === 'COD' ? 'COMPLETED' : 'PENDING'
    });

    // 7. Record Shipment record
    await orderRepository.createShipment({
      orderId,
      shippingMethod: totals.shipping === 0 ? 'EXPRESS' : 'STANDARD',
      status: 'PENDING'
    });

    const orderDetails = await orderRepository.getOrderById(orderId);

    // Trigger asynchronous event
    eventEmitter.emit('order.placed', { order: orderDetails, userId });
    await adminRepository.logAction({ userId, action: 'CREATE_ORDER', details: `Placed order ID: ${orderId} (${orderDetails.orderNumber})` });

    return orderDetails;
  }
};
export default checkoutService;
