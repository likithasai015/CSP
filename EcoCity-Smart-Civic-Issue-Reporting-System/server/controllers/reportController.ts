import { Request, Response, NextFunction } from 'express';
import StorageService from '../services/storageService.js';
import BrevoService from '../services/brevoService.js';
import mockDataService, { IReportData } from '../services/mockDataService.js';

export class ReportController {
  /**
   * Submit a new civic issue report
   * POST /api/reports
   */
  public static async submitReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        name,
        email,
        locationName,
        latitude,
        longitude,
        description,
        title,
        category,
        contact
      } = req.body;

      // 1. Validate required fields
      const citizenName =
        name && typeof name === 'string' && name.trim() !== ''
          ? name.trim()
          : 'Citizen Reporter';

      if (!email || typeof email !== 'string' || email.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Citizen email is required'
        });
        return;
      }

      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email.trim())) {
        res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
        return;
      }

      if (!locationName || typeof locationName !== 'string' || locationName.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Location name is required'
        });
        return;
      }

      // 2. Validate uploaded photo
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'A photo of the civic issue is required'
        });
        return;
      }

      // 3. Parse optional GPS coordinates
      let parsedLat: number | undefined;
      let parsedLng: number | undefined;

      if (latitude !== undefined && latitude !== null && latitude !== '') {
        const numLat = parseFloat(latitude);
        if (!isNaN(numLat) && numLat >= -90 && numLat <= 90) {
          parsedLat = numLat;
        }
      }

      if (longitude !== undefined && longitude !== null && longitude !== '') {
        const numLng = parseFloat(longitude);
        if (!isNaN(numLng) && numLng >= -180 && numLng <= 180) {
          parsedLng = numLng;
        }
      }

      // 4. Process photo via StorageService
      const uploadResult = await StorageService.processUploadedFile(
        req.file,
        req.get('host'),
        req.protocol
      );

      // 5. Categorize and assign department
      const reportCategory = (category && category.trim()) || 'Garbage';
      const getDepartmentByCategory = (cat: string): string => {
        switch (cat) {
          case 'Garbage': return 'Sanitation Department';
          case 'Potholes': return 'Public Works Department';
          case 'Broken Streetlights': return 'Electrical Department';
          case 'Water Leakage': return 'Water Department';
          case 'Drainage': return 'Sewer Department';
          case 'Stray Animal Issues': return 'Animal Control Department';
          case 'Illegal Tree Cutting': return 'Parks & Forestry Department';
          case 'Pollution': return 'Environmental Protection Department';
          default: return 'General Municipal Administration';
        }
      };

      const department = getDepartmentByCategory(reportCategory);
      const reportTitle =
        (title && title.trim()) ||
        `${reportCategory} Issue at ${locationName.trim()}`;

      // 6. Create report in centralized in-memory mock-data service
      const savedReport = mockDataService.createReport({
        name: citizenName,
        email: email.trim().toLowerCase(),
        locationName: locationName.trim(),
        latitude: parsedLat,
        longitude: parsedLng,
        description: description ? description.trim() : '',
        title: reportTitle,
        category: reportCategory,
        department,
        assignedDepartment: department,
        contact: contact ? contact.trim() : undefined,
        photoUrl: uploadResult.url,
        photoPublicId: uploadResult.publicId,
        status: 'Pending',
        priority: 'Medium'
      });

      console.log(`[Report Created] ID: ${savedReport.complaintId} (Mock ID: ${savedReport._id})`);

      // 7. Dispatch transactional email through Brevo to likithamindi024@gmail.com
      const brevoResult = await BrevoService.sendComplaintNotification(savedReport);

      // Update emailNotification state in mock data store
      mockDataService.updateEmailNotification(savedReport._id, {
        sent: brevoResult.sent,
        messageId: brevoResult.messageId,
        error: brevoResult.error,
        attemptedAt: new Date()
      });
      savedReport.emailNotification = {
        sent: brevoResult.sent,
        messageId: brevoResult.messageId,
        error: brevoResult.error,
        attemptedAt: new Date()
      };

      // 8. Return response
      const statusMessage = brevoResult.sent
        ? 'Civic issue report submitted and email notification accepted by Brevo for delivery to administrator'
        : `Civic issue report recorded in EcoCity system, but Brevo email delivery could not be initiated: ${brevoResult.error}`;

      res.status(201).json({
        success: true,
        message: statusMessage,
        data: savedReport,
        emailNotification: {
          sent: brevoResult.sent,
          messageId: brevoResult.messageId,
          error: brevoResult.error
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Retrieve civic reports for an authorized administrator
   * GET /api/reports
   */
  public static async getAllReports(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        status,
        category,
        search,
        page = '1',
        limit = '20',
        sort = 'latest'
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));

      const result = mockDataService.getAllReports({
        status: status as string,
        category: category as string,
        search: search as string,
        page: pageNum,
        limit: limitNum,
        sort: sort as string
      });

      res.status(200).json({
        success: true,
        data: result.reports,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Public endpoint to get recent reports (sanitized citizen details)
   * GET /api/reports/public/recent
   */
  public static async getPublicRecentReports(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const reports = mockDataService.getPublicRecentReports(10);
      res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Retrieve a specific report by ID or Complaint ID
   * GET /api/reports/:id
   */
  public static async getReportById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const report = mockDataService.getReportById(id);

      if (!report) {
        res.status(404).json({
          success: false,
          message: `Civic issue report not found with ID ${id}`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Update a report's status (Administrator only)
   * PATCH /api/reports/:id/status
   */
  public static async updateReportStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes, assignedDepartment, priority, resolutionImage } = req.body;

      const allowedStatuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
      if (!status || !allowedStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}`
        });
        return;
      }

      const updatedReport = mockDataService.updateReportStatus(id, {
        status,
        notes,
        assignedDepartment,
        priority,
        resolutionImage
      });

      if (!updatedReport) {
        res.status(404).json({
          success: false,
          message: `Civic issue report not found with ID ${id}`
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Report status successfully updated to ${status}`,
        data: updatedReport
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Resend Brevo email notification for a report (Admin only)
   * POST /api/reports/:id/resend-email
   */
  public static async resendNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const report = mockDataService.getReportById(id);

      if (!report) {
        res.status(404).json({
          success: false,
          message: `Civic issue report not found with ID ${id}`
        });
        return;
      }

      const brevoResult = await BrevoService.sendComplaintNotification(report);
      mockDataService.updateEmailNotification(report._id, {
        sent: brevoResult.sent,
        messageId: brevoResult.messageId,
        error: brevoResult.error,
        attemptedAt: new Date()
      });
      report.emailNotification = {
        sent: brevoResult.sent,
        messageId: brevoResult.messageId,
        error: brevoResult.error,
        attemptedAt: new Date()
      };

      res.status(200).json({
        success: true,
        message: brevoResult.sent
          ? 'Email notification resent successfully'
          : 'Email sending failed',
        emailNotification: report.emailNotification
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Summary stats endpoint (convenience for admin dashboard)
   * GET /api/reports/stats
   */
  public static async getStats(
    _req: Request,
    res: Response
  ): Promise<void> {
    const stats = mockDataService.getStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  }
}

export default ReportController;
