import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.js';
import mockDataService from '../services/mockDataService.js';

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

      const admin = mockDataService.validateAdminCredentials(email, password);

      if (!admin) {
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
          id: admin.id,
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
          id: admin.id,
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
      if (!req.user || req.user.role !== 'admin') {
        res.status(401).json({
          success: false,
          message: 'Not authenticated as administrator'
        });
        return;
      }

      const admin = mockDataService.getAdminById(req.user.id);

      res.status(200).json({
        success: true,
        user: {
          id: admin ? admin.id : req.user.id,
          name: admin ? admin.name : 'EcoCity Administrator',
          email: admin ? admin.email : req.user.email,
          role: 'admin'
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
