import { Router } from 'express';
import ReportController from '../controllers/reportController';
import { uploadReportPhoto } from '../middleware/upload';
import { requireAdmin } from '../middleware/auth';
import { submissionLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public citizen submission route with rate limiting & image upload middleware
router.post('/', submissionLimiter, uploadReportPhoto, ReportController.submitReport);

// Public recent reports route for landing / citizen overview
router.get('/public/recent', ReportController.getPublicRecentReports);

// Administrator-protected routes
router.get('/', requireAdmin, ReportController.getAllReports);
router.get('/:id', ReportController.getReportById);
router.patch('/:id/status', requireAdmin, ReportController.updateReportStatus);
router.post('/:id/resend-email', requireAdmin, ReportController.resendNotification);

// Convenience department & priority updates (as defined in frontend api.ts)
router.patch('/:id/department', requireAdmin, (req, res, next) => {
  req.body.assignedDepartment = req.body.assignedDepartment || req.body.department;
  req.body.status = req.body.status || 'In Progress';
  ReportController.updateReportStatus(req, res, next);
});

router.patch('/:id/priority', requireAdmin, (req, res, next) => {
  req.body.status = req.body.status || 'In Progress';
  ReportController.updateReportStatus(req, res, next);
});

export default router;
