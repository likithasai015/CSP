import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const adminApiKey = req.headers['x-admin-key'] as string;
    const configuredApiKey = process.env.ADMIN_API_KEY;

    // 1. Support X-Admin-Key if configured
    if (
      configuredApiKey &&
      configuredApiKey.trim() !== '' &&
      adminApiKey &&
      adminApiKey === configuredApiKey.trim()
    ) {
      req.user = {
        id: 'api-key-admin',
        email: process.env.ADMIN_EMAIL || 'admin@ecocity.org',
        role: 'admin'
      };
      return next();
    }

    // 2. Validate Bearer Token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied: Authorization token required for administrative endpoints'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied: Malformed authorization header'
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'ecocity-default-jwt-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
      role: string;
    };

    if (decoded.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Administrator privileges required'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid authorization token'
    });
  }
};

export default requireAdmin;
