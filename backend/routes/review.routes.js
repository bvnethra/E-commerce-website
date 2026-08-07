import express from 'express';
import productController from '../controllers/product.controller.js';
import verifyToken from '../middlewares/auth.middleware.js';

const router = express.Router();

// Retrieve reviews for a specific product
router.get('/product/:productId', productController.getProductReviews);

// Add review (secured)
router.post('/product/:productId', verifyToken, productController.addProductReview);

export default router;
