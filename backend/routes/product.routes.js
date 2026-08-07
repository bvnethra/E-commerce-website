import express from 'express';
import productController from '../controllers/product.controller.js';

const router = express.Router();

// Product catalogue query endpoints
router.get('/', productController.getAllProducts);
router.get('/suggestions', productController.getSuggestions);

// Find individual product items
router.get('/:id(\\d+)', productController.getProductById);
router.get('/slug/:slug', productController.getProductBySlug);

export default router;
