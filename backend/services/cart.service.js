import orderRepository from '../repositories/order.repository.js';
import productRepository from '../repositories/product.repository.js';
import { redisClient, isRedisConnected } from '../config/redis.js';
import { ApiError } from '../middlewares/error.middleware.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export const cartService = {
  // Key generator helper
  getRedisKey(userId) {
    return `cart:${userId}`;
  },

  async getCart(userId) {
    const redisKey = this.getRedisKey(userId);

    // Attempt cache fetch
    if (isRedisConnected && redisClient) {
      try {
        const cached = await redisClient.get(redisKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        logger.warn('Failed to fetch cart from Redis cache: ' + err.message);
      }
    }

    // Database lookup
    const cartId = await orderRepository.getOrCreateCart(userId);
    const items = await orderRepository.getCartItems(cartId);

    // Save cache
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.set(redisKey, JSON.stringify(items), 'EX', 3600 * 24); // Expiry 24h
      } catch (err) {
        logger.warn('Failed to cache cart to Redis: ' + err.message);
      }
    }

    return items;
  },

  async invalidateCache(userId) {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.del(this.getRedisKey(userId));
      } catch (err) {
        logger.warn('Failed to invalidate Redis cache for user ' + userId);
      }
    }
  },

  async addCartItem(userId, { productId, variantId = null, quantity = 1 }) {
    // 1. Validate Product & Variant exists
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    if (variantId) {
      const variants = await productRepository.getVariantsByProductId(productId);
      const hasVariant = variants.some(v => v.id === parseInt(variantId, 10));
      if (!hasVariant) {
        throw new ApiError(400, 'Invalid variant for product');
      }
    }

    // 2. Validate Inventory
    const inventory = await productRepository.getInventory(productId, variantId);
    if (!inventory || inventory.quantity < quantity) {
      throw new ApiError(400, `Insufficient stock. Only ${inventory ? inventory.quantity : 0} items available.`);
    }

    // 3. Save to database
    const cartId = await orderRepository.getOrCreateCart(userId);
    await orderRepository.addCartItem(cartId, productId, variantId, quantity);

    // 4. Invalidate Cache
    await this.invalidateCache(userId);

    return this.getCart(userId);
  },

  async updateCartItem(userId, { productId, variantId = null, quantity }) {
    if (quantity <= 0) {
      return this.removeCartItem(userId, productId, variantId);
    }

    // Validate inventory levels
    const inventory = await productRepository.getInventory(productId, variantId);
    if (!inventory || inventory.quantity < quantity) {
      throw new ApiError(400, `Only ${inventory ? inventory.quantity : 0} units left in stock.`);
    }

    const cartId = await orderRepository.getOrCreateCart(userId);
    await orderRepository.updateCartItem(cartId, productId, variantId, quantity);
    await this.invalidateCache(userId);

    return this.getCart(userId);
  },

  async removeCartItem(userId, productId, variantId = null) {
    const cartId = await orderRepository.getOrCreateCart(userId);
    await orderRepository.removeCartItem(cartId, productId, variantId);
    await this.invalidateCache(userId);

    return this.getCart(userId);
  },

  async clearCart(userId) {
    const cartId = await orderRepository.getOrCreateCart(userId);
    await orderRepository.clearCart(cartId);
    await this.invalidateCache(userId);
  },

  // Merge guest cart items into registered customer cart
  async mergeGuestCart(userId, guestItems) {
    if (!Array.isArray(guestItems) || guestItems.length === 0) return this.getCart(userId);

    for (const item of guestItems) {
      const prodId = item.productId || (item.product && item.product.id);
      const varId = item.variantId || (item.variant && item.variant.id) || null;
      const qty = item.quantity || 1;

      if (!prodId) continue;

      try {
        await this.addCartItem(userId, { productId: prodId, variantId: varId, quantity: qty });
      } catch (err) {
        logger.warn(`Failed to merge item ${prodId} for user ${userId}: ${err.message}`);
        // Skip items that are out of stock or deleted
      }
    }

    return this.getCart(userId);
  }
};
export default cartService;
