import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.js';
import Admin from '../models/Admin.js';

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
      const normalizedEmail =
        typeof email === 'string' ? email.trim().toLowerCase() : '';
      const rawPassword =
        typeof password === 'string' ? password.trim() : '';

      if (!normalizedEmail || !rawPassword) {
        res.status(400).json({
          success: false,
          message: 'Both email and password are required'
        });
        return;
      }

      // 1. Look up admin in MongoDB
      let admin = await Admin.findOne({ email: normalizedEmail }).exec();
      let isValid = false;

      if (admin) {
        isValid = await admin.comparePassword(rawPassword);
      } else {
        // Fallback for initial account provisioning if not yet seeded
        const envEmail = (
          process.env.ADMIN_EMAIL || 'likithamindi024@gmail.com'
        )
          .trim()
          .toLowerCase();

        const envPassword = (process.env.ADMIN_PASSWORD || 'likitha123').trim();

        if (normalizedEmail === envEmail && rawPassword === envPassword) {
          const hashedPassword = await bcrypt.hash(rawPassword, 10);
          admin = await Admin.create({
            name: process.env.ADMIN_NAME || 'EcoCity Administrator',
            email: envEmail,
            password: hashedPassword,
            role: 'admin'
          });
          isValid = true;
        }
      }

      if (!admin || !isValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid administrator email or password'
        });
        return;
      }

      const jwtSecret =
        process.env.JWT_SECRET ||
        'ecocity-default-jwt-secret-key-change-in-production';

      const token = jwt.sign(
        {
          id: String(admin._id || admin.id),
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
          id: String(admin._id || admin.id),
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

      let admin: any = null;
      if (mongoose.isValidObjectId(req.user.id)) {
        admin = await Admin.findById(req.user.id).exec();
      }
      if (!admin && req.user.email) {
        admin = await Admin.findOne({ email: req.user.email }).exec();
      }

      res.status(200).json({
        success: true,
        user: {
          id: admin ? String(admin._id || admin.id) : req.user.id,
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
