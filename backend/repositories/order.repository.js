import pool from '../config/db.js';

export const orderRepository = {
  // Carts & Cart Items
  async getOrCreateCart(userId) {
    // Try to get existing cart
    let [rows] = await pool.query('SELECT id FROM cart WHERE user_id = ?', [userId]);
    if (rows.length > 0) return rows[0].id;

    // Create new cart
    const [result] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
    return result.insertId;
  },

  async getCartItems(cartId) {
    const [rows] = await pool.query(
      `SELECT ci.id, ci.product_id as productId, ci.product_variant_id as variantId, ci.quantity,
              p.name, p.slug, p.price as basePrice, p.image_url as imageUrl,
              pv.sku, pv.price as variantPrice, pv.sku_details as skuDetails
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
       WHERE ci.cart_id = ?`,
      [cartId]
    );
    return rows.map(r => ({
      product: {
        id: r.productId,
        name: r.name,
        slug: r.slug,
        price: parseFloat(r.variantPrice || r.basePrice),
        imageUrl: r.imageUrl
      },
      variant: r.variantId ? {
        id: r.variantId,
        sku: r.sku,
        price: parseFloat(r.variantPrice),
        skuDetails: r.skuDetails
      } : null,
      quantity: r.quantity
    }));
  },

  async addCartItem(cartId, productId, variantId = null, quantity = 1) {
    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, product_variant_id, quantity)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [cartId, productId, variantId, quantity]
    );
  },

  async updateCartItem(cartId, productId, variantId = null, quantity = 1) {
    await pool.query(
      `UPDATE cart_items SET quantity = ? 
       WHERE cart_id = ? AND product_id = ? AND (product_variant_id = ? OR (product_variant_id IS NULL AND ? IS NULL))`,
      [quantity, cartId, productId, variantId, variantId]
    );
  },

  async removeCartItem(cartId, productId, variantId = null) {
    await pool.query(
      `DELETE FROM cart_items 
       WHERE cart_id = ? AND product_id = ? AND (product_variant_id = ? OR (product_variant_id IS NULL AND ? IS NULL))`,
      [cartId, productId, variantId, variantId]
    );
  },

  async clearCart(cartId) {
    await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
  },

  // Coupons
  async findCouponByCode(code) {
    const [rows] = await pool.query(
      `SELECT id, code, discount_type as discountType, discount_value as discountValue,
              min_purchase_amount as minPurchase, max_discount_amount as maxDiscount,
              start_date as startDate, end_date as endDate, usage_limit as usageLimit,
              usage_count as usageCount, is_active as isActive
       FROM coupons WHERE code = ?`,
      [code]
    );
    return rows[0] || null;
  },

  async incrementCouponUsage(couponId) {
    await pool.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?', [couponId]);
  },

  // Orders
  async createOrder({ userId, totalAmount, couponId = null, shippingAddressId = null, billingAddressId = null, status = 'PENDING' }) {
    const [result] = await pool.query(
      `INSERT INTO orders (user_id, total_amount, coupon_id, shipping_address_id, billing_address_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, totalAmount, couponId, shippingAddressId, billingAddressId, status]
    );
    return result.insertId;
  },

  async createOrderItem({ orderId, productId, variantId = null, quantity, price }) {
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, product_variant_id, quantity, price)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, productId, variantId, quantity, price]
    );
  },

  async getOrderById(orderId) {
    const [orders] = await pool.query(
      `SELECT o.id, o.order_date as orderDate, o.status, o.total_amount as totalAmount,
              c.code as couponCode, c.discount_value as couponValue,
              sa.address_line1 as shipAddress, sa.city as shipCity, sa.state as shipState, sa.zip_code as shipZip, sa.country as shipCountry
       FROM orders o
       LEFT JOIN coupons c ON o.coupon_id = c.id
       LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
       WHERE o.id = ?`,
      [orderId]
    );
    if (orders.length === 0) return null;
    const order = orders[0];

    const [items] = await pool.query(
      `SELECT oi.id, oi.quantity, oi.price, p.name, p.slug, p.image_url as imageUrl,
              pv.sku, pv.sku_details as skuDetails
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    return {
      id: order.id,
      orderNumber: `ORD-${order.id.toString().padStart(6, '0')}`,
      createdAt: order.orderDate,
      totalAmount: parseFloat(order.totalAmount),
      status: order.status,
      coupon: order.couponCode ? { code: order.couponCode, value: parseFloat(order.couponValue) } : null,
      shippingAddress: {
        addressLine1: order.shipAddress,
        city: order.shipCity,
        state: order.shipState,
        zipCode: order.shipZip,
        country: order.shipCountry
      },
      items: items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price),
        product: {
          name: item.name,
          slug: item.slug,
          imageUrl: item.imageUrl
        },
        variant: item.sku ? {
          sku: item.sku,
          skuDetails: item.skuDetails
        } : null
      }))
    };
  },

  async getOrdersByUser(userId) {
    const [orders] = await pool.query(
      `SELECT id FROM orders WHERE user_id = ? ORDER BY order_date DESC`,
      [userId]
    );

    const orderDetails = [];
    for (const orderRow of orders) {
      const details = await this.getOrderById(orderRow.id);
      if (details) orderDetails.push(details);
    }
    return orderDetails;
  },

  async updateOrderStatus(orderId, status) {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
  },

  // Payments
  async createPayment({ orderId, paymentMethod, amount, status = 'PENDING', transactionId = null }) {
    const [result] = await pool.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, transaction_id)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status=VALUES(status), transaction_id=VALUES(transaction_id)`,
      [orderId, paymentMethod, amount, status, transactionId]
    );
    return result.insertId;
  },

  async updatePaymentStatus(transactionId, status) {
    await pool.query('UPDATE payments SET status = ? WHERE transaction_id = ?', [status, transactionId]);
  },

  async getPaymentByOrderId(orderId) {
    const [rows] = await pool.query(
      `SELECT id, order_id as orderId, payment_method as paymentMethod, amount, status, transaction_id as transactionId, payment_date as paymentDate
       FROM payments WHERE order_id = ?`,
      [orderId]
    );
    return rows[0] || null;
  },

  // Shipments
  async createShipment({ orderId, shippingMethod, trackingNumber = null, status = 'PENDING' }) {
    await pool.query(
      `INSERT INTO shipments (order_id, shipping_method, tracking_number, status)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status=VALUES(status), tracking_number=VALUES(tracking_number)`,
      [orderId, shippingMethod, trackingNumber, status]
    );
  },

  async getShipmentByOrderId(orderId) {
    const [rows] = await pool.query(
      `SELECT id, order_id as orderId, shipping_method as shippingMethod, tracking_number as trackingNumber, status, shipped_at as shippedAt, delivered_at as deliveredAt
       FROM shipments WHERE order_id = ?`,
      [orderId]
    );
    return rows[0] || null;
  }
};
export default orderRepository;
