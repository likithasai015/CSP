import { Router } from 'express';
import AuthController from '../controllers/authController.js';
import { requireAdmin } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, AuthController.login);
router.get('/me', requireAdmin, AuthController.getMe);
router.get('/logout', AuthController.logout);

export default router;
