import express from 'express';
import authController from '../controllers/auth.controller.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// Apply auth rate limiting to registration and logins
router.post('/signup', authLimiter, authController.signup);
router.post('/signin', authLimiter, authController.signin);

// Token and credentials operations
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Third-party OAuth integration
router.post('/google', authController.googleLogin);

export default router;
