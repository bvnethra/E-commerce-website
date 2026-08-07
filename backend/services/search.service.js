import productRepository from '../repositories/product.repository.js';
import { redisClient, isRedisConnected } from '../config/redis.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export const searchService = {
  // Generate cache keys for queries
  getSearchCacheKey(params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}:${params[k]}`)
      .join('|');
    return `search_results:${sortedParams}`;
  },

  async searchProducts(filters) {
    const cacheKey = this.getSearchCacheKey(filters);

    // Try cache lookup
    if (isRedisConnected && redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        logger.warn('Failed to fetch search results from Redis cache: ' + err.message);
      }
    }

    // Database lookup
    const products = await productRepository.getAllProducts(filters);

    // Cache database results
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(products), 'EX', 300); // 5 mins cache TTL
      } catch (err) {
        logger.warn('Failed to cache search results to Redis: ' + err.message);
      }
    }

    return products;
  },

  async getAutoSuggestions(query) {
    if (!query || query.length < 2) return [];

    const cacheKey = `suggestions:${query.toLowerCase().trim()}`;

    // Redis lookup
    if (isRedisConnected && redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        logger.warn('Failed to fetch suggestions cache: ' + err.message);
      }
    }

    // Direct database fetch for suggestions
    const products = await productRepository.getAllProducts({
      search: query,
      limit: 5
    });

    const suggestions = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category.name
    }));

    // Save suggestions cache
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(suggestions), 'EX', 600); // 10 mins cache TTL
      } catch (err) {
        logger.warn('Failed to cache suggestions to Redis: ' + err.message);
      }
    }

    return suggestions;
  }
};
export default searchService;
