import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { ApiError } from './error.middleware.js';
import pool from '../config/db.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Access Token Required'));
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, config.jwt.secret, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return next(new ApiError(401, 'Access Token Expired'));
        }
        return next(new ApiError(401, 'Invalid Access Token'));
      }

      // Optional database lookup to verify user status and roles
      try {
        const [users] = await pool.query(
          `SELECT u.id, u.username, u.email, GROUP_CONCAT(r.name) as roles 
           FROM users u
           LEFT JOIN user_roles ur ON u.id = ur.user_id
           LEFT JOIN roles r ON ur.role_id = r.id
           WHERE u.id = ?
           GROUP BY u.id`,
          [decoded.id]
        );

        if (users.length === 0) {
          return next(new ApiError(404, 'User associated with token not found'));
        }

        const user = users[0];
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles ? user.roles.split(',') : []
        };

        next();
      } catch (dbErr) {
        // Fallback to decoded token values if DB is temporarily locked
        req.user = {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          roles: decoded.roles || ['ROLE_USER']
        };
        next();
      }
    });
  } catch (error) {
    next(new ApiError(500, 'Authentication check error', error));
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized access'));
    }
    
    const hasRole = req.user.roles.some(role => roles.includes(role));
    if (!hasRole) {
      return next(new ApiError(403, 'Access Forbidden: Insufficient Permissions'));
    }
    next();
  };
};
export default verifyToken;
