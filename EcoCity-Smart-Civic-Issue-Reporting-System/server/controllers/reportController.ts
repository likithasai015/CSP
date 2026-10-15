import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Report, { IReport } from '../models/Report.js';
import StorageService from '../services/storageService.js';
import BrevoService from '../services/brevoService.js';

export class ReportController {
  /**
   * Submit a new garbage complaint
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

      // 1. Validate required fields (Email, Location, and Photo are required)
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
          message: 'A photo of the garbage issue is required'
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

      // 4. Upload photo via StorageService (Cloudinary or local static storage)
      const uploadResult = await StorageService.processUploadedFile(
        req.file,
        req.get('host'),
        req.protocol
      );

      // 5. Generate unique human-readable complaint ID
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const complaintId = `ECO-${timestamp}-${randomNum}`;

      // 6. Persist complaint in MongoDB
      const reportCategory = (category && category.trim()) || 'Garbage';
      const reportTitle =
        (title && title.trim()) ||
        `Garbage Issue at ${locationName.trim()}`;

      const newReport: IReport = new Report({
        complaintId,
        name: citizenName,
        email: email.trim().toLowerCase(),
        locationName: locationName.trim(),
        latitude: parsedLat,
        longitude: parsedLng,
        description: description ? description.trim() : '',
        title: reportTitle,
        category: reportCategory,
        contact: contact ? contact.trim() : undefined,
        photoUrl: uploadResult.url,
        photoPublicId: uploadResult.publicId,
        status: 'Pending',
        department: 'Sanitation Department',
        emailNotification: {
          sent: false,
          attemptedAt: new Date()
        }
      });

      const savedReport = await newReport.save();
      console.log(`[Complaint Saved] ID: ${savedReport.complaintId} (_id: ${savedReport._id})`);

      // 7. Dispatch email notification to ADMIN_EMAIL via Brevo
      // The complaint is already saved, so failure here will NOT lose the complaint
      const brevoResult = await BrevoService.sendComplaintNotification(savedReport);

      // Update complaint record with Brevo result
      savedReport.emailNotification = {
        sent: brevoResult.sent,
        messageId: brevoResult.messageId,
        error: brevoResult.error,
        attemptedAt: new Date()
      };
      await savedReport.save();

      // 8. Return response
      const statusMessage = brevoResult.sent
        ? 'Garbage complaint submitted and notification email dispatched to administrator'
        : 'Garbage complaint saved, but email notification could not be delivered';

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
   * Retrieve complaints for an authorized administrator
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

      const query: any = {};

      if (status && status !== 'All') {
        query.status = status;
      }

      if (category && category !== 'All') {
        query.category = category;
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { complaintId: searchRegex },
          { name: searchRegex },
          { email: searchRegex },
          { locationName: searchRegex },
          { description: searchRegex },
          { title: searchRegex }
        ];
      }

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const sortOption: any = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

      const [reports, total] = await Promise.all([
        Report.find(query).sort(sortOption).skip(skip).limit(limitNum),
        Report.countDocuments(query)
      ]);

      res.status(200).json({
        success: true,
        data: reports,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Public endpoint to get recent reports (sanitized, citizen email/contact omitted)
   * GET /api/reports/public/recent
   */
  public static async getPublicRecentReports(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const reports = await Report.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('-email -contact');

      res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Retrieve a specific complaint by ID
   * GET /api/reports/:id
   */
  public static async getReportById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      let report: IReport | null = null;

      if (mongoose.Types.ObjectId.isValid(id)) {
        report = await Report.findById(id);
      }

      if (!report) {
        report = await Report.findOne({ complaintId: id });
      }

      if (!report) {
        res.status(404).json({
          success: false,
          message: `Complaint not found with ID ${id}`
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
   * Update a complaint's status (Administrator only)
   * PATCH /api/reports/:id/status
   */
  public static async updateReportStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes, assignedDepartment, priority } = req.body;

      const allowedStatuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
      if (!status || !allowedStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}`
        });
        return;
      }

      let report: IReport | null = null;

      if (mongoose.Types.ObjectId.isValid(id)) {
        report = await Report.findById(id);
      }

      if (!report) {
        report = await Report.findOne({ complaintId: id });
      }

      if (!report) {
        res.status(404).json({
          success: false,
          message: `Complaint not found with ID ${id}`
        });
        return;
      }

      report.status = status;
      if (notes) report.resolutionNotes = notes;
      if (assignedDepartment) report.assignedDepartment = assignedDepartment;
      if (priority) report.priority = priority;

      const updatedReport = await report.save();

      res.status(200).json({
        success: true,
        message: `Complaint status successfully updated to ${status}`,
        data: updatedReport
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Resend email notification for a complaint (Admin only)
   * POST /api/reports/:id/resend-email
   */
  public static async resendNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      let report: IReport | null = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        report = await Report.findById(id);
      }
      if (!report) {
        report = await Report.findOne({ complaintId: id });
      }

      if (!report) {
        res.status(404).json({
          success: false,
          message: `Complaint not found with ID ${id}`
        });
        return;
      }

      const brevoResult = await BrevoService.sendComplaintNotification(report);
      report.emailNotification = {
        sent: brevoResult.sent,
        messageId: brevoResult.messageId,
        error: brevoResult.error,
        attemptedAt: new Date()
      };
      await report.save();

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
}

export default ReportController;
