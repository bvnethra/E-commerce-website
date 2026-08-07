import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import userRepository from '../repositories/user.repository.js';
import adminRepository from '../repositories/admin.repository.js';
import { redisClient, isRedisConnected } from '../config/redis.js';
import { ApiError } from '../middlewares/error.middleware.js';

// Local cache fallback for OTPs if Redis is down
const localOtpStore = new Map();

export const authService = {
  // Generate Access and Refresh JWT Tokens
  generateTokens(user) {
    const payload = { id: user.id, username: user.username, email: user.email, roles: user.roles };
    const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpiry });
    const refreshToken = jwt.sign({ id: user.id }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiry });
    return { accessToken, refreshToken };
  },

  async register({ username, email, password, firstName, lastName, phoneNumber }) {
    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      throw new ApiError(400, 'Username already taken');
    }

    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      throw new ApiError(400, 'Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await userRepository.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber
    });

    // Assign default role ROLE_USER (id = 1)
    await userRepository.assignRole(userId, 1);

    const roles = ['ROLE_USER'];
    const user = { id: userId, username, email, roles };
    
    // Log audit activity
    await adminRepository.logAction({ userId, action: 'REGISTER', details: 'User registered successfully' });

    return { user, ...this.generateTokens(user) };
  },

  async login(username, password, ipAddress = null) {
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new ApiError(401, 'Invalid username or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid username or password');
    }

    const roles = await userRepository.getRoles(user.id);
    const userPayload = { id: user.id, username: user.username, email: user.email, roles };

    await adminRepository.logAction({ userId: user.id, action: 'LOGIN', details: 'User logged in', ipAddress });

    return { user: userPayload, ...this.generateTokens(userPayload) };
  },

  async refresh(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await userRepository.findById(decoded.id);
      if (!user) {
        throw new ApiError(401, 'User associated with token not found');
      }

      const roles = await userRepository.getRoles(user.id);
      const userPayload = { id: user.id, username: user.username, email: user.email, roles };

      return this.generateTokens(userPayload);
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
  },

  // OTP Verification Engine
  async generateOTP(key, expirySeconds = 300) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP

    if (isRedisConnected && redisClient) {
      await redisClient.set(`otp:${key}`, otp, 'EX', expirySeconds);
    } else {
      localOtpStore.set(`otp:${key}`, { otp, expiry: Date.now() + expirySeconds * 1000 });
    }

    return otp;
  },

  async verifyOTP(key, otp) {
    let cachedOtp;

    if (isRedisConnected && redisClient) {
      cachedOtp = await redisClient.get(`otp:${key}`);
      if (cachedOtp === otp) {
        await redisClient.del(`otp:${key}`);
        return true;
      }
    } else {
      const data = localOtpStore.get(`otp:${key}`);
      if (data) {
        if (data.expiry > Date.now() && data.otp === otp) {
          localOtpStore.delete(`otp:${key}`);
          return true;
        } else if (data.expiry <= Date.now()) {
          localOtpStore.delete(`otp:${key}`);
        }
      }
    }

    return false;
  },

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(404, 'No account registered with this email');
    }

    const otp = await this.generateOTP(email);
    // In production, we'd trigger service dispatching emails, here we'll log it
    console.log(`[AUTH SERVICE - ForgotPassword] OTP for ${email} is ${otp}`);
    return { message: 'OTP sent to email successfully' };
  },

  async verifyAndResetPassword(email, otp, newPassword) {
    const isValid = await this.verifyOTP(email, otp);
    if (!isValid) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Reuse update method to reset password (need to write a custom query or handle directly)
    await userRepository.update(user.id, {
      firstName: user.first_name,
      lastName: user.last_name,
      phoneNumber: user.phone_number
    });

    // Directly update password field
    import('../config/db.js').then(async (m) => {
      await m.default.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
    });

    await adminRepository.logAction({ userId: user.id, action: 'RESET_PASSWORD', details: 'Password reset completed via OTP' });

    return { message: 'Password reset successfully' };
  },

  // Mock Google OAuth integration
  async googleOAuthLogin(googleToken) {
    // In production, verify google token via google-auth-library.
    // For simulation, we'll mock verify and sign up / login a user.
    const mockEmail = `google_${googleToken.substring(0, 5)}@aura.com`;
    const mockUsername = `google_user_${googleToken.substring(0, 5)}`;

    let user = await userRepository.findByEmail(mockEmail);
    let userId;

    if (!user) {
      userId = await userRepository.create({
        username: mockUsername,
        email: mockEmail,
        password: await bcrypt.hash('OAuthGooglePass123!', 10),
        firstName: 'Google',
        lastName: 'User'
      });
      await userRepository.assignRole(userId, 1); // default user
    } else {
      userId = user.id;
    }

    const dbUser = await userRepository.findById(userId);
    const roles = await userRepository.getRoles(userId);
    const userPayload = { id: dbUser.id, username: dbUser.username, email: dbUser.email, roles };

    await adminRepository.logAction({ userId: dbUser.id, action: 'GOOGLE_LOGIN', details: 'Authenticated via Google OAuth' });

    return { user: userPayload, ...this.generateTokens(userPayload) };
  }
};
export default authService;
