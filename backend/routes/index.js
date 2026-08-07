import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import reviewRoutes from './review.routes.js';
import adminRoutes from './admin.routes.js';
import productController from '../controllers/product.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDoc = JSON.parse(readFileSync(path.join(__dirname, '../docs/swagger.json'), 'utf8'));

const router = express.Router();

// Swagger Documentation Route
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerDoc));


// Mount modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);

// Top level endpoints needed by customer-portal client
router.get('/categories', productController.getCategories);
router.get('/brands', productController.getBrands);

// Mount transaction/cart/order/checkout/coupon routes directly under /api prefix
router.use('/', orderRoutes);

export default router;
