import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { AuthRequest } from '../middleware/auth.js';

export class AuthController {
  /**
   * Administrator Login
   * POST /api/auth/login
   */
  public static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Both email and password are required'
        });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      let admin = await Admin.findOne({ email: normalizedEmail });

      // If admin doesn't exist yet, check if credentials match .env or development configuration
      if (!admin) {
        const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const configuredAdminPassword = process.env.ADMIN_PASSWORD?.trim();
        const isProduction = process.env.NODE_ENV === 'production';

        // Check configured .env credentials
        if (
          configuredAdminEmail &&
          configuredAdminPassword &&
          normalizedEmail === configuredAdminEmail &&
          password === configuredAdminPassword
        ) {
          admin = await Admin.create({
            email: configuredAdminEmail,
            name: process.env.ADMIN_NAME || 'System Administrator',
            password: configuredAdminPassword,
            role: 'admin'
          });
        } else if (!isProduction && normalizedEmail === 'admin@ecocity.com' && password === 'Admin@123') {
          // Development convenience only: initialize default admin in non-production mode
          admin = await Admin.create({
            email: 'admin@ecocity.com',
            name: 'EcoCity Administrator',
            password: 'Admin@123',
            role: 'admin'
          });
        }
      }

      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Invalid administrator email or password'
        });
        return;
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid administrator email or password'
        });
        return;
      }

      const jwtSecret =
        process.env.JWT_SECRET || 'ecocity-default-jwt-secret-key-change-in-production';
      const token = jwt.sign(
        {
          id: admin._id,
          email: admin.email,
          role: admin.role
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        message: 'Admin authentication successful',
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get Current Authenticated Administrator Profile
   * GET /api/auth/me
   */
  public static async getMe(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }

      const admin = await Admin.findById(req.user.id).select('-password');
      if (!admin) {
        res.status(200).json({
          success: true,
          user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            name: 'Administrator'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Logout (clears session client side)
   * GET /api/auth/logout
   */
  public static async logout(
    _req: Request,
    res: Response
  ): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

export default AuthController;
