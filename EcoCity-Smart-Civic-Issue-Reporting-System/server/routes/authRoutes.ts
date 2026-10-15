import { Router } from 'express';
import AuthController from '../controllers/authController';
import { requireAdmin } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, AuthController.login);
router.get('/me', requireAdmin, AuthController.getMe);
router.get('/logout', AuthController.logout);

export default router;
