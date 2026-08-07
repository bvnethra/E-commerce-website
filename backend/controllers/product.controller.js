import productRepository from '../repositories/product.repository.js';
import searchService from '../services/search.service.js';
import { ApiError } from '../middlewares/error.middleware.js';

export const productController = {
  async getAllProducts(req, res, next) {
    try {
      const { categoryId, brandId, minPrice, maxPrice, search, limit, offset, sortBy } = req.query;
      
      const filters = {
        categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
        brandId: brandId ? parseInt(brandId, 10) : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        search,
        limit: limit ? parseInt(limit, 10) : 24,
        offset: offset ? parseInt(offset, 10) : 0,
        sortBy
      };

      const result = await searchService.searchProducts(filters);
      
      // Send directly as an array of products to match client-side expectations
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getProductById(req, res, next) {
    try {
      const product = await productRepository.findById(req.params.id);
      if (!product) {
        return next(new ApiError(404, 'Product not found'));
      }
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  },

  async getProductBySlug(req, res, next) {
    try {
      const product = await productRepository.findBySlug(req.params.slug);
      if (!product) {
        return next(new ApiError(404, 'Product not found'));
      }
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  },

  async getCategories(req, res, next) {
    try {
      const categories = await productRepository.getCategories();
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  },

  async getBrands(req, res, next) {
    try {
      const brands = await productRepository.getBrands();
      res.status(200).json(brands);
    } catch (error) {
      next(error);
    }
  },

  async getSuggestions(req, res, next) {
    try {
      const query = req.query.q;
      const suggestions = await searchService.getAutoSuggestions(query);
      res.status(200).json({
        status: 'success',
        data: suggestions
      });
    } catch (error) {
      next(error);
    }
  },

  // Reviews
  async getProductReviews(req, res, next) {
    try {
      const productId = req.params.productId;
      const reviews = await productRepository.getReviews(productId);
      res.status(200).json(reviews);
    } catch (error) {
      next(error);
    }
  },

  async addProductReview(req, res, next) {
    try {
      const productId = req.params.productId;
      const { rating, comment } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return next(new ApiError(400, 'Rating must be between 1 and 5 stars'));
      }

      // Check verified purchase (Optional validation)
      const hasBought = await productRepository.checkUserBoughtProduct(req.user.id, productId);

      await productRepository.addReview(req.user.id, productId, { rating, comment });
      
      res.status(201).json({
        status: 'success',
        message: 'Review submitted successfully',
        data: { verifiedPurchase: hasBought }
      });
    } catch (error) {
      next(error);
    }
  }
};
export default productController;
