import userRepository from '../repositories/user.repository.js';
import notificationService from '../services/notification.service.js';
import { ApiError } from '../middlewares/error.middleware.js';

export const userController = {
  async getProfile(req, res, next) {
    try {
      const user = await userRepository.findById(req.user.id);
      if (!user) {
        return next(new ApiError(404, 'User profile not found'));
      }
      res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phoneNumber } = req.body;
      const updatedUser = await userRepository.update(req.user.id, { firstName, lastName, phoneNumber });
      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  },

  // Address book
  async getAddresses(req, res, next) {
    try {
      const addresses = await userRepository.getAddresses(req.user.id);
      res.status(200).json({
        status: 'success',
        data: addresses
      });
    } catch (error) {
      next(error);
    }
  },

  async addAddress(req, res, next) {
    try {
      const { addressLine1, addressLine2, city, state, zipCode, country, isDefaultShipping, isDefaultBilling } = req.body;
      if (!addressLine1 || !city || !state || !zipCode || !country) {
        return next(new ApiError(400, 'Address fields are incomplete'));
      }

      const addressId = await userRepository.addAddress(req.user.id, {
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        country,
        isDefaultShipping,
        isDefaultBilling
      });

      res.status(201).json({
        status: 'success',
        message: 'Address added successfully',
        data: { addressId }
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteAddress(req, res, next) {
    try {
      const addressId = req.params.id;
      const success = await userRepository.deleteAddress(addressId, req.user.id);
      if (!success) {
        return next(new ApiError(404, 'Address not found or unauthorized'));
      }
      res.status(200).json({
        status: 'success',
        message: 'Address deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Saved Cards
  async getCards(req, res, next) {
    try {
      const cards = await userRepository.getCards(req.user.id);
      res.status(200).json({
        status: 'success',
        data: cards
      });
    } catch (error) {
      next(error);
    }
  },

  async addCard(req, res, next) {
    try {
      const { cardToken, cardBrand, lastFour, expiryMonth, expiryYear } = req.body;
      if (!cardToken || !cardBrand || !lastFour || !expiryMonth || !expiryYear) {
        return next(new ApiError(400, 'Tokenized card parameters are incomplete'));
      }

      const cardId = await userRepository.addCard(req.user.id, {
        cardToken,
        cardBrand,
        lastFour,
        expiryMonth,
        expiryYear
      });

      res.status(201).json({
        status: 'success',
        message: 'Payment card saved successfully',
        data: { cardId }
      });
    } catch (error) {
      next(error);
    }
  },

  // Wishlist
  async getWishlist(req, res, next) {
    try {
      const wishlist = await userRepository.getWishlist(req.user.id);
      res.status(200).json({
        status: 'success',
        data: wishlist
      });
    } catch (error) {
      next(error);
    }
  },

  async addToWishlist(req, res, next) {
    try {
      const { productId } = req.body;
      if (!productId) {
        return next(new ApiError(400, 'Product ID is required'));
      }

      await userRepository.addToWishlist(req.user.id, productId);
      res.status(200).json({
        status: 'success',
        message: 'Added to wishlist'
      });
    } catch (error) {
      next(error);
    }
  },

  async removeFromWishlist(req, res, next) {
    try {
      const productId = req.params.productId;
      await userRepository.removeFromWishlist(req.user.id, productId);
      res.status(200).json({
        status: 'success',
        message: 'Removed from wishlist'
      });
    } catch (error) {
      next(error);
    }
  },

  // Notifications
  async getNotifications(req, res, next) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user.id);
      res.status(200).json({
        status: 'success',
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  },

  async markNotificationRead(req, res, next) {
    try {
      const notificationId = req.params.id;
      const success = await notificationService.markAsRead(notificationId, req.user.id);
      if (!success) {
        return next(new ApiError(404, 'Notification not found or unauthorized'));
      }
      res.status(200).json({
        status: 'success',
        message: 'Notification marked as read'
      });
    } catch (error) {
      next(error);
    }
  }
};
export default userController;
