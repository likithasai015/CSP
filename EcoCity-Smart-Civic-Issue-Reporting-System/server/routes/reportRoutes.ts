import { Router } from 'express';
import ReportController from '../controllers/reportController.js';
import { uploadReportPhoto } from '../middleware/upload.js';
import { requireAdmin } from '../middleware/auth.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public citizen submission route with rate limiting & image upload middleware
router.post('/', submissionLimiter, uploadReportPhoto, ReportController.submitReport);

// Public recent reports route for landing / citizen overview
router.get('/public/recent', ReportController.getPublicRecentReports);

// Administrator stats summary
router.get('/stats', requireAdmin, ReportController.getStats);

// Administrator-protected list route
router.get('/', requireAdmin, ReportController.getAllReports);

// Specific report details by ID
router.get('/:id', ReportController.getReportById);

// Administrator update routes
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
