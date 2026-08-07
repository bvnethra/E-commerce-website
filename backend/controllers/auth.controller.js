import authService from '../services/auth.service.js';
import { ApiError } from '../middlewares/error.middleware.js';

export const authController = {
  async signup(req, res, next) {
    try {
      const { username, email, password, firstName, lastName, phoneNumber } = req.body;
      if (!username || !email || !password) {
        return next(new ApiError(400, 'Username, email, and password are required'));
      }

      const result = await authService.register({
        username,
        email,
        password,
        firstName,
        lastName,
        phoneNumber
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async signin(req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return next(new ApiError(400, 'Username and password are required'));
      }

      const result = await authService.login(username, password, req.ip);
      
      // Send token in the exact structure expected by the existing UI client-side
      res.status(200).json({
        token: result.accessToken,
        refreshToken: result.refreshToken,
        type: 'Bearer',
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        roles: result.user.roles
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return next(new ApiError(400, 'Refresh token is required'));
      }

      const result = await authService.refresh(refreshToken);
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return next(new ApiError(400, 'Email address is required'));
      }

      const result = await authService.forgotPassword(email);
      res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return next(new ApiError(400, 'Email, OTP code, and new password are required'));
      }

      const result = await authService.verifyAndResetPassword(email, otp, newPassword);
      res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  },

  async googleLogin(req, res, next) {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return next(new ApiError(400, 'Google idToken is required'));
      }

      const result = await authService.googleOAuthLogin(idToken);
      res.status(200).json({
        token: result.accessToken,
        refreshToken: result.refreshToken,
        type: 'Bearer',
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        roles: result.user.roles
      });
    } catch (error) {
      next(error);
    }
  }
};
export default authController;
