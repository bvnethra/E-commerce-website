import express from 'express';
import userController from '../controllers/user.controller.js';
import verifyToken from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply JWT verification to user management sub-routes
router.use(verifyToken);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Address Book CRUD
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.addAddress);
router.delete('/addresses/:id', userController.deleteAddress);

// Saved Cards (Tokenized)
router.get('/cards', userController.getCards);
router.post('/cards', userController.addCard);

// Customer Wishlist
router.get('/wishlist', userController.getWishlist);
router.post('/wishlist', userController.addToWishlist);
router.delete('/wishlist/:productId', userController.removeFromWishlist);

// In-app Notification inbox
router.get('/notifications', userController.getNotifications);
router.put('/notifications/:id/read', userController.markNotificationRead);

export default router;
