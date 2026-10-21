import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import StorageService from '../services/storageService.js';
import BrevoService from '../services/brevoService.js';
import Report from '../models/Report.js';
import type { IReportData } from '../services/mockDataService.js';

// Use a flexible model reference to avoid Mongoose query overload type conflicts.
const ReportModel: any = Report;

const allowedStatuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const allowedPriorities = ['Low', 'Medium', 'High', 'Critical'];

// Preserve the response fields expected by the existing frontend.
function toReportResponse(doc: any): any {
  const report = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const id = String(report._id ?? report.id ?? report.complaintId);

  return {
    ...report,
    _id: id,
    id: report.id || id,
    location: report.location || report.locationName,
    img: report.img || report.photoUrl,
    user: report.user || report.name,
    userEmail: report.userEmail || report.email,
    date: report.date || report.createdAt,
    emailNotification: report.emailNotification || { sent: false }
  };
}

// Adapt MongoDB documents to the shape expected by the existing Brevo service.
function toBrevoReport(report: any): IReportData {
  const r = typeof report?.toObject === 'function' ? report.toObject() : report || {};
  const id = String(r._id ?? r.id ?? r.complaintId ?? '');

  return {
    ...r,
    _id: id,
    id: r.id || id,
    complaintId: r.complaintId || '',
    name: r.name || 'Citizen Reporter',
    email: r.email || '',
    locationName: r.locationName || r.location || '',
    description: r.description || '',
    title: r.title || 'Civic Issue',
    category: r.category || 'Garbage',
    department: r.department || r.assignedDepartment || 'General Municipal Administration',
    photoUrl: r.photoUrl || r.img || '',
    latitude: r.latitude,
    longitude: r.longitude,
    contact: r.contact,
    status: r.status || 'Pending',
    priority: r.priority || 'Medium',
    emailNotification: r.emailNotification || { sent: false },
    createdAt: r.createdAt || new Date(),
    updatedAt: r.updatedAt || new Date()
  } as IReportData;
}

// Find reports by MongoDB ID, application ID, or complaint ID.
async function findReport(id: string): Promise<any | null> {
  if (mongoose.isValidObjectId(id)) {
    const byMongoId = await ReportModel.findById(id).exec();
    if (byMongoId) return byMongoId;
  }

  return ReportModel.findOne({
    $or: [{ id }, { complaintId: id }]
  }).exec();
}

export class ReportController {
  /**
   * Submit a report and save it permanently in MongoDB.
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

      const citizenName =
        typeof name === 'string' && name.trim()
          ? name.trim()
          : 'Citizen Reporter';

      const citizenEmail =
        typeof email === 'string' ? email.trim().toLowerCase() : '';

      if (!citizenEmail) {
        res.status(400).json({
          success: false,
          message: 'Citizen email is required'
        });
        return;
      }

      if (!/^\S+@\S+\.\S+$/.test(citizenEmail)) {
        res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
        return;
      }

      if (typeof locationName !== 'string' || !locationName.trim()) {
        res.status(400).json({
          success: false,
          message: 'Location name is required'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'A photo of the civic issue is required'
        });
        return;
      }

      const parseCoordinate = (
        value: unknown,
        min: number,
        max: number
      ): number | undefined => {
        if (value === undefined || value === null || value === '') {
          return undefined;
        }

        const number = Number(value);

        return Number.isFinite(number) && number >= min && number <= max
          ? number
          : undefined;
      };

      const reportCategory =
        typeof category === 'string' && category.trim()
          ? category.trim()
          : 'Garbage';

      const departmentMap: Record<string, string> = {
        Garbage: 'Sanitation Department',
        Potholes: 'Public Works Department',
        'Broken Streetlights': 'Electrical Department',
        'Water Leakage': 'Water Department',
        Drainage: 'Sewer Department',
        'Stray Animal Issues': 'Animal Control Department',
        'Illegal Tree Cutting': 'Parks & Forestry Department',
        Pollution: 'Environmental Protection Department'
      };

      const department =
        departmentMap[reportCategory] ||
        'General Municipal Administration';

      // Process the uploaded photo using the existing storage service.
      const upload = await StorageService.processUploadedFile(
        req.file,
        req.get('host'),
        req.protocol
      );

      const now = new Date();

      const complaintId =
        `ECO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create the report in MongoDB.
      const created = await ReportModel.create({
        complaintId,
        id: complaintId,
        name: citizenName,
        email: citizenEmail,
        locationName: locationName.trim(),
        latitude: parseCoordinate(latitude, -90, 90),
        longitude: parseCoordinate(longitude, -180, 180),
        description:
          typeof description === 'string' ? description.trim() : '',
        title:
          typeof title === 'string' && title.trim()
            ? title.trim()
            : `${reportCategory} Issue at ${locationName.trim()}`,
        category: reportCategory,
        department,
        assignedDepartment: department,
        contact:
          typeof contact === 'string' && contact.trim()
            ? contact.trim()
            : undefined,
        photoUrl: upload.url,
        photoPublicId: upload.publicId,
        status: 'Pending',
        priority: 'Medium',
        emailNotification: { sent: false },
        location: locationName.trim(),
        img: upload.url,
        user: citizenName,
        userEmail: citizenEmail,
        date: now.toISOString()
      });

      // Attempt the administrator notification without losing the saved report
      // if Brevo returns an error.
      let emailNotification: Record<string, unknown>;

      try {
        const emailResult =
          await BrevoService.sendComplaintNotification(toBrevoReport(created));

        emailNotification = {
          sent: emailResult.sent,
          messageId: emailResult.messageId,
          error: emailResult.error,
          attemptedAt: new Date()
        };
      } catch (emailError) {
        emailNotification = {
          sent: false,
          error:
            emailError instanceof Error
              ? emailError.message
              : 'Email notification failed',
          attemptedAt: new Date()
        };
      }

      created.emailNotification = emailNotification;
      await created.save();

      res.status(201).json({
        success: true,
        message: emailNotification.sent
          ? 'Report saved to MongoDB and email notification accepted by Brevo'
          : `Report saved to MongoDB, but email notification could not be sent: ${emailNotification.error || 'delivery error'}`,
        data: toReportResponse(created),
        emailNotification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reports for the authenticated administrator.
   * GET /api/reports
   */
  public static async getAllReports(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const status =
        typeof req.query.status === 'string' ? req.query.status : undefined;

      const category =
        typeof req.query.category === 'string' ? req.query.category : undefined;

      const search =
        typeof req.query.search === 'string' ? req.query.search.trim() : '';

      const page = Math.max(
        1,
        Number.parseInt(String(req.query.page || '1'), 10) || 1
      );

      const limit = Math.max(
        1,
        Math.min(
          100,
          Number.parseInt(String(req.query.limit || '20'), 10) || 20
        )
      );

      const filter: any = {};

      if (status && status !== 'all') {
        filter.status = status;
      }

      if (category && category !== 'all') {
        filter.category = category;
      }

      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');

        filter.$or = [
          { complaintId: regex },
          { name: regex },
          { email: regex },
          { locationName: regex },
          { title: regex },
          { category: regex },
          { department: regex },
          { description: regex }
        ];
      }

      const sortOrder = req.query.sort === 'oldest' ? 1 : -1;

      const [documents, total] = await Promise.all([
        ReportModel.find(filter)
          .sort({ createdAt: sortOrder })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean()
          .exec(),
        ReportModel.countDocuments(filter).exec()
      ]);

      res.status(200).json({
        success: true,
        data: documents.map(toReportResponse),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the latest public reports without exposing citizen contact details.
   * GET /api/reports/public/recent
   */
  public static async getPublicRecentReports(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const reports = await ReportModel.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
        .exec();

      const safeReports = reports.map((report: any) => {
        const result = toReportResponse(report);

        delete result.email;
        delete result.contact;
        delete result.userEmail;

        return result;
      });

      res.status(200).json({
        success: true,
        data: safeReports
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve one report by MongoDB ID or complaint ID.
   * GET /api/reports/:id
   */
  public static async getReportById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const report = await findReport(req.params.id);

      if (!report) {
        res.status(404).json({
          success: false,
          message: `Civic issue report not found with ID ${req.params.id}`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: toReportResponse(report)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update report status and administrator-managed fields.
   * PATCH /api/reports/:id/status
   */
  public static async updateReportStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        status,
        notes,
        assignedDepartment,
        priority,
        resolutionImage
      } = req.body;

      const updates: Record<string, unknown> = {};

      if (status !== undefined) {
        if (!allowedStatuses.includes(status)) {
          res.status(400).json({
            success: false,
            message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
          });
          return;
        }

        updates.status = status;
      }

      if (assignedDepartment !== undefined) {
        updates.assignedDepartment = assignedDepartment;
      }

      if (notes !== undefined) {
        updates.resolutionNotes = notes;
      }

      if (resolutionImage !== undefined) {
        updates.resolutionImage = resolutionImage;
      }

      if (priority !== undefined) {
        if (!allowedPriorities.includes(priority)) {
          res.status(400).json({
            success: false,
            message: `Invalid priority. Allowed values: ${allowedPriorities.join(', ')}`
          });
          return;
        }

        updates.priority = priority;
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No valid report fields supplied for update'
        });
        return;
      }

      const report = await findReport(req.params.id);

      if (!report) {
        res.status(404).json({
          success: false,
          message: `Civic issue report not found with ID ${req.params.id}`
        });
        return;
      }

      Object.assign(report, updates);
      await report.save();

      res.status(200).json({
        success: true,
        message: 'Report updated successfully',
        data: toReportResponse(report)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retry the administrator email notification.
   * POST /api/reports/:id/resend-email
   */
  public static async resendNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const report = await findReport(req.params.id);

      if (!report) {
        res.status(404).json({
          success: false,
          message: `Civic issue report not found with ID ${req.params.id}`
        });
        return;
      }

      const emailResult =
        await BrevoService.sendComplaintNotification(toBrevoReport(report));

      report.emailNotification = {
        sent: emailResult.sent,
        messageId: emailResult.messageId,
        error: emailResult.error,
        attemptedAt: new Date()
      };

      await report.save();

      res.status(200).json({
        success: true,
        message: emailResult.sent
          ? 'Email notification resent successfully'
          : `Email delivery failed: ${emailResult.error || 'delivery error'}`,
        emailNotification: report.emailNotification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Return statistics calculated from MongoDB.
   * GET /api/reports/stats
   */
  public static async getStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const [total, pending, inProgress, resolved, rejected] =
        await Promise.all([
          ReportModel.countDocuments().exec(),
          ReportModel.countDocuments({ status: 'Pending' }).exec(),
          ReportModel.countDocuments({ status: 'In Progress' }).exec(),
          ReportModel.countDocuments({ status: 'Resolved' }).exec(),
          ReportModel.countDocuments({ status: 'Rejected' }).exec()
        ]);

      res.status(200).json({
        success: true,
        data: {
          total,
          pending,
          inProgress,
          resolved,
          rejected
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ReportController;
