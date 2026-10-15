// server/index.ts
import express from "express";
import cors from "cors";
import path3 from "path";
import fs3 from "fs";
import os2 from "os";
import dotenv2 from "dotenv";

// server/config/db.ts
import mongoose from "mongoose";
var cached = global.mongooseCache;
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}
var connectDB = async () => {
  const isServerless3 = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const defaultLocalURI = isServerless3 ? "" : "mongodb://127.0.0.1:27017/ecocity";
  const mongoURI = process.env.MONGODB_URI?.trim() || defaultLocalURI;
  if (!mongoURI) {
    console.warn("[Database] MONGODB_URI is not set in environment variables.");
    return null;
  }
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8e3,
      connectTimeoutMS: 1e4
    };
    cached.promise = mongoose.connect(mongoURI, opts).then((m) => {
      console.log(`[Database] MongoDB connected successfully: ${m.connection.host}/${m.connection.name}`);
      return m;
    });
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    throw error;
  }
};

// server/routes/reportRoutes.ts
import { Router } from "express";

// server/controllers/reportController.ts
import mongoose3 from "mongoose";

// server/models/Report.ts
import mongoose2, { Schema } from "mongoose";
var emailNotificationSchema = new Schema(
  {
    sent: { type: Boolean, default: false },
    messageId: { type: String },
    error: { type: String },
    attemptedAt: { type: Date }
  },
  { _id: false }
);
var reportSchema = new Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      default: "Citizen Reporter",
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    email: {
      type: String,
      required: [true, "Citizen email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    locationName: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
      maxlength: [200, "Location name cannot exceed 200 characters"]
    },
    latitude: {
      type: Number,
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"]
    },
    longitude: {
      type: Number,
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2e3, "Description cannot exceed 2000 characters"],
      default: ""
    },
    title: {
      type: String,
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"]
    },
    category: {
      type: String,
      default: "Garbage",
      trim: true
    },
    department: {
      type: String,
      default: "Sanitation Department",
      trim: true
    },
    contact: {
      type: String,
      trim: true
    },
    photoUrl: {
      type: String,
      required: [true, "Garbage photo is required"]
    },
    photoPublicId: {
      type: String
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
      index: true
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    },
    assignedDepartment: {
      type: String
    },
    resolutionNotes: {
      type: String
    },
    resolutionImage: {
      type: String
    },
    emailNotification: {
      type: emailNotificationSchema,
      default: () => ({ sent: false })
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        ret.location = ret.locationName;
        ret.img = ret.photoUrl;
        ret.user = ret.name;
        ret.userEmail = ret.email;
        ret.date = ret.createdAt ? new Date(ret.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }) : "";
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);
var Report = mongoose2.model("Report", reportSchema);
var Report_default = Report;

// server/services/storageService.ts
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
var StorageService = class {
  static isCloudinaryConfigured() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    return !!(cloudName && apiKey && apiSecret && cloudName !== "your_cloud_name" && apiKey !== "your_api_key");
  }
  /**
   * Upload an image file to Cloudinary if configured; otherwise generate a reliable URL.
   * In serverless environments (Vercel) without Cloudinary, converts the image buffer into a
   * self-contained Data URI so the image is persistently preserved in MongoDB and viewable.
   */
  static async processUploadedFile(file, reqHost, protocol) {
    const isServerless3 = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    if (this.isCloudinaryConfigured()) {
      try {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
          api_key: process.env.CLOUDINARY_API_KEY?.trim(),
          api_secret: process.env.CLOUDINARY_API_SECRET?.trim()
        });
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: "ecocity/complaints",
          resource_type: "image"
        });
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch {
        }
        return {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        };
      } catch (err) {
        console.warn(`[Storage] Cloudinary upload failed (${err.message}). Falling back to local storage.`);
      }
    }
    if (isServerless3) {
      try {
        if (file.path && fs.existsSync(file.path)) {
          const fileBuffer = fs.readFileSync(file.path);
          const mimeType = file.mimetype || "image/jpeg";
          const dataUri = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
          try {
            fs.unlinkSync(file.path);
          } catch {
          }
          const filename2 = path.basename(file.path);
          return {
            url: dataUri,
            publicId: filename2
          };
        }
      } catch (readErr) {
        console.warn(`[Storage Warning] Could not encode file as Data URI: ${readErr.message}`);
      }
    }
    const baseUrl = process.env.SERVER_URL || (reqHost ? `${protocol || "http"}://${reqHost}` : "http://localhost:5000");
    const filename = path.basename(file.path);
    const localUrl = `${baseUrl}/uploads/${filename}`;
    return {
      url: localUrl,
      publicId: filename
    };
  }
};
var storageService_default = StorageService;

// server/services/brevoService.ts
import { BrevoClient } from "@getbrevo/brevo";
import axios from "axios";
import dotenv from "dotenv";
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
var BrevoService = class {
  static getClient() {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "your_brevo_api_key_here") {
      return null;
    }
    return new BrevoClient({ apiKey: apiKey.trim() });
  }
  /**
   * Generates a modern, responsive HTML email template for the garbage complaint.
   * All user-supplied text fields are rigorously sanitized to prevent injection attacks.
   */
  static generateComplaintEmailHtml(report) {
    const sanitizedName = escapeHtml(report.name || "Citizen Reporter");
    const sanitizedEmail = escapeHtml(report.email);
    const sanitizedLocation = escapeHtml(report.locationName);
    const sanitizedContact = escapeHtml(report.contact);
    const sanitizedDescription = escapeHtml(report.description);
    const sanitizedComplaintId = escapeHtml(report.complaintId);
    const coordinatesText = report.latitude !== void 0 && report.longitude !== void 0 ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}` : null;
    const mapsUrl = coordinatesText ? `https://www.google.com/maps?q=${report.latitude},${report.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.locationName)}`;
    const formattedDate = report.createdAt ? new Date(report.createdAt).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short"
    }) : (/* @__PURE__ */ new Date()).toLocaleString("en-US");
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Garbage Complaint Received \u2013 EcoCity</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8FAFC;
      color: #1E293B;
    }
    .wrapper {
      max-width: 650px;
      margin: 30px auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #E2E8F0;
    }
    .header {
      background: linear-gradient(135deg, #0F766E 0%, #0D9488 100%);
      padding: 32px 30px;
      text-align: left;
      color: #FFFFFF;
    }
    .header h1 {
      margin: 0 0 6px 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 12px;
      background-color: rgba(255, 255, 255, 0.2);
      color: #FFFFFF;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 30px;
    }
    .alert-banner {
      background-color: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 14px 18px;
      border-radius: 8px;
      margin-bottom: 25px;
      font-size: 13.5px;
      color: #92400E;
      line-height: 1.5;
    }
    .card {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0F766E;
      margin: 0 0 14px 0;
      display: flex;
      align-items: center;
    }
    .field-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
      line-height: 1.5;
      border-bottom: 1px dashed #E2E8F0;
      padding-bottom: 8px;
    }
    .field-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .field-label {
      color: #64748B;
      font-weight: 500;
      min-width: 130px;
    }
    .field-value {
      color: #0F172A;
      font-weight: 600;
      text-align: right;
      word-break: break-word;
    }
    .description-box {
      background-color: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 14px;
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
      white-space: pre-wrap;
    }
    .button {
      display: inline-block;
      background-color: #0D9488;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      margin-top: 12px;
    }
    .image-container {
      text-align: center;
      margin-top: 14px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
      background-color: #000000;
    }
    .image-container img {
      max-width: 100%;
      height: auto;
      max-height: 400px;
      display: block;
      margin: 0 auto;
      object-fit: cover;
    }
    .view-image-link {
      display: block;
      margin-top: 10px;
      text-align: center;
      font-size: 13px;
      color: #0D9488;
      text-decoration: underline;
      font-weight: 600;
    }
    .footer {
      background-color: #F1F5F9;
      padding: 24px 30px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      border-top: 1px solid #E2E8F0;
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>EcoCity Civic Incident Report</h1>
      <p>Automated Municipal Alert &bull; Sanitation Division</p>
      <div class="badge">Complaint ID: ${sanitizedComplaintId}</div>
    </div>

    <div class="content">
      <div class="alert-banner">
        <strong>Action Required:</strong> A citizen has submitted a new garbage complaint. Please review the details below and dispatch a sanitation unit or update the status accordingly.
      </div>

      <!-- Citizen Details -->
      <div class="card">
        <div class="card-title">&bull; Citizen Information</div>
        <div class="field-row">
          <span class="field-label">Citizen Name:</span>
          <span class="field-value">${sanitizedName}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Email Address:</span>
          <span class="field-value"><a href="mailto:${sanitizedEmail}" style="color: #0D9488;">${sanitizedEmail}</a></span>
        </div>
        ${sanitizedContact ? `<div class="field-row">
                <span class="field-label">Contact Number:</span>
                <span class="field-value">${sanitizedContact}</span>
              </div>` : ""}
      </div>

      <!-- Incident Location -->
      <div class="card">
        <div class="card-title">&bull; Incident Location &amp; Timestamp</div>
        <div class="field-row">
          <span class="field-label">Location / Landmark:</span>
          <span class="field-value">${sanitizedLocation}</span>
        </div>
        ${coordinatesText ? `<div class="field-row">
                <span class="field-label">GPS Coordinates:</span>
                <span class="field-value">${coordinatesText}</span>
              </div>` : `<div class="field-row">
                <span class="field-label">GPS Coordinates:</span>
                <span class="field-value" style="color: #94A3B8; font-style: italic;">Not captured (Manual address provided)</span>
              </div>`}
        <div class="field-row">
          <span class="field-label">Submission Date:</span>
          <span class="field-value">${formattedDate}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Initial Status:</span>
          <span class="field-value" style="color: #D97706;">Pending Verification</span>
        </div>

        <div style="text-align: left; margin-top: 14px;">
          <a href="${mapsUrl}" target="_blank" class="button">Open in Google Maps &rarr;</a>
        </div>
      </div>

      <!-- Description -->
      <div class="card">
        <div class="card-title">&bull; Problem Description</div>
        <div class="description-box">
          ${sanitizedDescription || "No additional description was provided by the citizen."}
        </div>
      </div>

      <!-- Photographic Evidence -->
      <div class="card">
        <div class="card-title">&bull; Photographic Evidence</div>
        <p style="font-size: 13px; color: #64748B; margin-top: 0;">Uploaded garbage photo taken at the incident location:</p>
        <div class="image-container">
          <img src="${report.photoUrl}" alt="Garbage Complaint Evidence" />
        </div>
        <a href="${report.photoUrl}" target="_blank" class="view-image-link">
          Click here to view or download full-size photo &nearr;
        </a>
      </div>
    </div>

    <div class="footer">
      <p><strong>EcoCity Smart Civic Engagement Platform</strong></p>
      <p>This is an automated notification dispatched via Brevo Transactional Email Service.</p>
      <p>To inspect or update this issue, log in to the EcoCity Admin Portal.</p>
    </div>
  </div>
</body>
</html>`;
  }
  /**
   * Sends the transactional email to the administrator using Brevo API.
   * Gracefully returns BrevoSendResult without throwing an unhandled exception.
   */
  static async sendComplaintNotification(report) {
    dotenv.config({ override: true });
    const apiKey = process.env.BREVO_API_KEY?.trim();
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || "notifications@ecocity.org";
    const senderName = process.env.BREVO_SENDER_NAME?.trim() || "EcoCity Civic System";
    if (!apiKey || apiKey === "" || apiKey === "your_brevo_api_key_here") {
      const msg = "Brevo API key is not configured in environment variables (BREVO_API_KEY). Email notification skipped.";
      console.warn(`[Brevo Notification] ${msg}`);
      return { sent: false, error: msg };
    }
    if (!adminEmail || adminEmail === "" || adminEmail === "admin@yourdomain.com") {
      const msg = "Administrator email is not configured in environment variables (ADMIN_EMAIL). Email notification skipped.";
      console.warn(`[Brevo Notification] ${msg}`);
      return { sent: false, error: msg };
    }
    const subject = `New Garbage Complaint Received \u2013 EcoCity [${report.complaintId}]`;
    const htmlContent = this.generateComplaintEmailHtml(report);
    const emailPayload = {
      subject,
      htmlContent,
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: adminEmail,
          name: "EcoCity Administrator"
        }
      ],
      replyTo: {
        email: report.email,
        name: report.name
      }
    };
    if (report.photoUrl && report.photoUrl.startsWith("https://") && !report.photoUrl.includes("localhost") && !report.photoUrl.includes("127.0.0.1") && /\.(jpg|jpeg|png|webp)($|\?)/i.test(report.photoUrl)) {
      emailPayload.attachment = [
        {
          url: report.photoUrl,
          name: `complaint-${report.complaintId}.jpg`
        }
      ];
    }
    try {
      const client = this.getClient();
      let messageId;
      if (client && typeof client.transactionalEmails?.sendTransacEmail === "function") {
        const response = await client.transactionalEmails.sendTransacEmail(emailPayload);
        messageId = response?.messageId || response?.body?.messageId || "brevo-accepted";
      } else {
        const response = await axios.post("https://api.brevo.com/v3/smtp/email", emailPayload, {
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          timeout: 15e3
        });
        messageId = response.data?.messageId || "brevo-accepted";
      }
      console.log(`[Brevo Notification] Successfully sent email to ${adminEmail}. Message ID: ${messageId}`);
      return {
        sent: true,
        messageId
      };
    } catch (error) {
      const brevoErrMsg = error.response?.data?.message || error.response?.data?.code || error.message || "Unknown Brevo error";
      console.error(`[Brevo Notification Failed] Error sending to ${adminEmail}: ${brevoErrMsg}`);
      return {
        sent: false,
        error: `Brevo API error: ${brevoErrMsg}`
      };
    }
  }
};
var brevoService_default = BrevoService;

// server/controllers/reportController.ts
var ReportController = class {
  /**
   * Submit a new garbage complaint
   * POST /api/reports
   */
  static async submitReport(req, res, next) {
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
      const citizenName = name && typeof name === "string" && name.trim() !== "" ? name.trim() : "Citizen Reporter";
      if (!email || typeof email !== "string" || email.trim() === "") {
        res.status(400).json({
          success: false,
          message: "Citizen email is required"
        });
        return;
      }
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email.trim())) {
        res.status(400).json({
          success: false,
          message: "Please provide a valid email address"
        });
        return;
      }
      if (!locationName || typeof locationName !== "string" || locationName.trim() === "") {
        res.status(400).json({
          success: false,
          message: "Location name is required"
        });
        return;
      }
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "A photo of the garbage issue is required"
        });
        return;
      }
      let parsedLat;
      let parsedLng;
      if (latitude !== void 0 && latitude !== null && latitude !== "") {
        const numLat = parseFloat(latitude);
        if (!isNaN(numLat) && numLat >= -90 && numLat <= 90) {
          parsedLat = numLat;
        }
      }
      if (longitude !== void 0 && longitude !== null && longitude !== "") {
        const numLng = parseFloat(longitude);
        if (!isNaN(numLng) && numLng >= -180 && numLng <= 180) {
          parsedLng = numLng;
        }
      }
      const uploadResult = await storageService_default.processUploadedFile(
        req.file,
        req.get("host"),
        req.protocol
      );
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(1e3 + Math.random() * 9e3);
      const complaintId = `ECO-${timestamp}-${randomNum}`;
      const reportCategory = category && category.trim() || "Garbage";
      const reportTitle = title && title.trim() || `Garbage Issue at ${locationName.trim()}`;
      const newReport = new Report_default({
        complaintId,
        name: citizenName,
        email: email.trim().toLowerCase(),
        locationName: locationName.trim(),
        latitude: parsedLat,
        longitude: parsedLng,
        description: description ? description.trim() : "",
        title: reportTitle,
        category: reportCategory,
        contact: contact ? contact.trim() : void 0,
        photoUrl: uploadResult.url,
        photoPublicId: uploadResult.publicId,
        status: "Pending",
        department: "Sanitation Department",
        emailNotification: {
          sent: false,
          attemptedAt: /* @__PURE__ */ new Date()
        }
      });
      const savedReport = await newReport.save();
      console.log(`[Complaint Saved] ID: ${savedReport.complaintId} (_id: ${savedReport._id})`);
      const brevoResult = await brevoService_default.sendComplaintNotification(savedReport);
      savedReport.emailNotification = {
        sent: brevoResult.sent,
        messageId: brevoResult.messageId,
        error: brevoResult.error,
        attemptedAt: /* @__PURE__ */ new Date()
      };
      await savedReport.save();
      const statusMessage = brevoResult.sent ? "Garbage complaint submitted and notification email dispatched to administrator" : "Garbage complaint saved, but email notification could not be delivered";
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
    } catch (error) {
      next(error);
    }
  }
  /**
   * Retrieve complaints for an authorized administrator
   * GET /api/reports
   */
  static async getAllReports(req, res, next) {
    try {
      const {
        status,
        category,
        search,
        page = "1",
        limit = "20",
        sort = "latest"
      } = req.query;
      const query = {};
      if (status && status !== "All") {
        query.status = status;
      }
      if (category && category !== "All") {
        query.category = category;
      }
      if (search && typeof search === "string" && search.trim() !== "") {
        const searchRegex = new RegExp(search.trim(), "i");
        query.$or = [
          { complaintId: searchRegex },
          { name: searchRegex },
          { email: searchRegex },
          { locationName: searchRegex },
          { description: searchRegex },
          { title: searchRegex }
        ];
      }
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
      const skip = (pageNum - 1) * limitNum;
      const sortOption = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
      const [reports, total] = await Promise.all([
        Report_default.find(query).sort(sortOption).skip(skip).limit(limitNum),
        Report_default.countDocuments(query)
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
    } catch (error) {
      next(error);
    }
  }
  /**
   * Public endpoint to get recent reports (sanitized, citizen email/contact omitted)
   * GET /api/reports/public/recent
   */
  static async getPublicRecentReports(_req, res, next) {
    try {
      const reports = await Report_default.find().sort({ createdAt: -1 }).limit(10).select("-email -contact");
      res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Retrieve a specific complaint by ID
   * GET /api/reports/:id
   */
  static async getReportById(req, res, next) {
    try {
      const { id } = req.params;
      let report = null;
      if (mongoose3.Types.ObjectId.isValid(id)) {
        report = await Report_default.findById(id);
      }
      if (!report) {
        report = await Report_default.findOne({ complaintId: id });
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
    } catch (error) {
      next(error);
    }
  }
  /**
   * Update a complaint's status (Administrator only)
   * PATCH /api/reports/:id/status
   */
  static async updateReportStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes, assignedDepartment, priority } = req.body;
      const allowedStatuses = ["Pending", "In Progress", "Resolved", "Rejected"];
      if (!status || !allowedStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Invalid status. Allowed values are: ${allowedStatuses.join(", ")}`
        });
        return;
      }
      let report = null;
      if (mongoose3.Types.ObjectId.isValid(id)) {
        report = await Report_default.findById(id);
      }
      if (!report) {
        report = await Report_default.findOne({ complaintId: id });
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
    } catch (error) {
      next(error);
    }
  }
  /**
   * Resend email notification for a complaint (Admin only)
   * POST /api/reports/:id/resend-email
   */
  static async resendNotification(req, res, next) {
    try {
      const { id } = req.params;
      let report = null;
      if (mongoose3.Types.ObjectId.isValid(id)) {
        report = await Report_default.findById(id);
      }
      if (!report) {
        report = await Report_default.findOne({ complaintId: id });
      }
      if (!report) {
        res.status(404).json({
          success: false,
          message: `Complaint not found with ID ${id}`
        });
        return;
      }
      const brevoResult = await brevoService_default.sendComplaintNotification(report);
      report.emailNotification = {
        sent: brevoResult.sent,
        messageId: brevoResult.messageId,
        error: brevoResult.error,
        attemptedAt: /* @__PURE__ */ new Date()
      };
      await report.save();
      res.status(200).json({
        success: true,
        message: brevoResult.sent ? "Email notification resent successfully" : "Email sending failed",
        emailNotification: report.emailNotification
      });
    } catch (error) {
      next(error);
    }
  }
};
var reportController_default = ReportController;

// server/middleware/upload.ts
import multer from "multer";
import path2 from "path";
import fs2 from "fs";
import os from "os";
import crypto from "crypto";
var isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
var uploadDir = isServerless ? path2.join(os.tmpdir(), "ecocity-uploads") : path2.resolve(process.cwd(), "uploads");
try {
  if (!fs2.existsSync(uploadDir)) {
    fs2.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn(`[Uploads Directory Warning] Could not create directory ${uploadDir}: ${err.message}`);
}
var storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path2.extname(file.originalname).toLowerCase();
    const safeRandom = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    cb(null, `report-${timestamp}-${safeRandom}${ext}`);
  }
});
var fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const ext = path2.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed."));
  }
};
var uploadReportPhoto = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5 MB
  },
  fileFilter
}).single("photo");

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
var requireAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const adminApiKey = req.headers["x-admin-key"];
    const configuredApiKey = process.env.ADMIN_API_KEY;
    if (configuredApiKey && configuredApiKey.trim() !== "" && adminApiKey && adminApiKey === configuredApiKey.trim()) {
      req.user = {
        id: "api-key-admin",
        email: process.env.ADMIN_EMAIL || "admin@ecocity.org",
        role: "admin"
      };
      return next();
    }
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access denied: Authorization token required for administrative endpoints"
      });
      return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access denied: Malformed authorization header"
      });
      return;
    }
    const jwtSecret = process.env.JWT_SECRET || "ecocity-default-jwt-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Forbidden: Administrator privileges required"
      });
      return;
    }
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Session expired. Please log in again."
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: "Invalid authorization token"
    });
  }
};

// server/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";
var getClientIp = (req) => {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.headers?.["x-real-ip"] || req.ip || req.socket?.remoteAddress || "127.0.0.1";
};
var submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 30,
  // Limit each IP to 30 submissions per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: {
    success: false,
    message: "Too many reports submitted from this IP address. Please wait 15 minutes before submitting again."
  }
});
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 15,
  // Limit each IP to 15 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes."
  }
});
var apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  validate: { xForwardedForHeader: false, trustProxy: false }
});

// server/routes/reportRoutes.ts
var router = Router();
router.post("/", submissionLimiter, uploadReportPhoto, reportController_default.submitReport);
router.get("/public/recent", reportController_default.getPublicRecentReports);
router.get("/", requireAdmin, reportController_default.getAllReports);
router.get("/:id", reportController_default.getReportById);
router.patch("/:id/status", requireAdmin, reportController_default.updateReportStatus);
router.post("/:id/resend-email", requireAdmin, reportController_default.resendNotification);
router.patch("/:id/department", requireAdmin, (req, res, next) => {
  req.body.assignedDepartment = req.body.assignedDepartment || req.body.department;
  req.body.status = req.body.status || "In Progress";
  reportController_default.updateReportStatus(req, res, next);
});
router.patch("/:id/priority", requireAdmin, (req, res, next) => {
  req.body.status = req.body.status || "In Progress";
  reportController_default.updateReportStatus(req, res, next);
});
var reportRoutes_default = router;

// server/routes/authRoutes.ts
import { Router as Router2 } from "express";

// server/controllers/authController.ts
import jwt2 from "jsonwebtoken";

// server/models/Admin.ts
import mongoose4, { Schema as Schema2 } from "mongoose";
import bcrypt from "bcryptjs";
var adminSchema = new Schema2(
  {
    name: {
      type: String,
      default: "EcoCity Administrator",
      trim: true
    },
    email: {
      type: String,
      required: [true, "Admin email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Admin password is required"],
      minlength: [6, "Password must be at least 6 characters"]
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin"
    }
  },
  {
    timestamps: true
  }
);
adminSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
var Admin = mongoose4.model("Admin", adminSchema);
var Admin_default = Admin;

// server/controllers/authController.ts
var AuthController = class {
  /**
   * Administrator Login
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: "Both email and password are required"
        });
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();
      let admin = await Admin_default.findOne({ email: normalizedEmail });
      if (!admin) {
        const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const configuredAdminPassword = process.env.ADMIN_PASSWORD?.trim();
        const isProduction = process.env.NODE_ENV === "production";
        if (configuredAdminEmail && configuredAdminPassword && normalizedEmail === configuredAdminEmail && password === configuredAdminPassword) {
          admin = await Admin_default.create({
            email: configuredAdminEmail,
            name: process.env.ADMIN_NAME || "System Administrator",
            password: configuredAdminPassword,
            role: "admin"
          });
        } else if (!isProduction && normalizedEmail === "admin@ecocity.com" && password === "Admin@123") {
          admin = await Admin_default.create({
            email: "admin@ecocity.com",
            name: "EcoCity Administrator",
            password: "Admin@123",
            role: "admin"
          });
        }
      }
      if (!admin) {
        res.status(401).json({
          success: false,
          message: "Invalid administrator email or password"
        });
        return;
      }
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: "Invalid administrator email or password"
        });
        return;
      }
      const jwtSecret = process.env.JWT_SECRET || "ecocity-default-jwt-secret-key-change-in-production";
      const token = jwt2.sign(
        {
          id: admin._id,
          email: admin.email,
          role: admin.role
        },
        jwtSecret,
        { expiresIn: "7d" }
      );
      res.status(200).json({
        success: true,
        message: "Admin authentication successful",
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get Current Authenticated Administrator Profile
   * GET /api/auth/me
   */
  static async getMe(req, res, next) {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
        return;
      }
      const admin = await Admin_default.findById(req.user.id).select("-password");
      if (!admin) {
        res.status(200).json({
          success: true,
          user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            name: "Administrator"
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
    } catch (error) {
      next(error);
    }
  }
  /**
   * Logout (clears session client side)
   * GET /api/auth/logout
   */
  static async logout(_req, res) {
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  }
};
var authController_default = AuthController;

// server/routes/authRoutes.ts
var router2 = Router2();
router2.post("/login", authLimiter, authController_default.login);
router2.get("/me", requireAdmin, authController_default.getMe);
router2.get("/logout", authController_default.logout);
var authRoutes_default = router2;

// server/middleware/errorHandler.ts
import multer2 from "multer";
var errorHandler = (err, _req, res, _next) => {
  console.error("[Error Handler]", err);
  if (err instanceof multer2.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        message: "File size exceeds maximum allowed limit of 5 MB"
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
    return;
  }
  if (err.message && err.message.includes("Only JPEG, PNG, and WebP images are allowed")) {
    res.status(400).json({
      success: false,
      message: err.message
    });
    return;
  }
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    res.status(400).json({
      success: false,
      message: messages.join(", ")
    });
    return;
  }
  if (err.name === "CastError") {
    res.status(404).json({
      success: false,
      message: "Resource not found with the specified ID"
    });
    return;
  }
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var errorHandler_default = errorHandler;

// server/index.ts
dotenv2.config();
var app = express();
var PORT = process.env.PORT || 5e3;
app.set("trust proxy", 1);
app.use((req, _res, next) => {
  if (!req.socket) {
    req.socket = { remoteAddress: "127.0.0.1" };
  } else if (!req.socket.remoteAddress) {
    req.socket.remoteAddress = "127.0.0.1";
  }
  next();
});
var isServerless2 = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
var uploadDir2 = isServerless2 ? path3.join(os2.tmpdir(), "ecocity-uploads") : path3.resolve(process.cwd(), "uploads");
try {
  if (!fs3.existsSync(uploadDir2)) {
    fs3.mkdirSync(uploadDir2, { recursive: true });
  }
} catch {
}
var allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL
].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }
      try {
        const originUrl = new URL(origin);
        if (originUrl.hostname.endsWith(".vercel.app")) {
          return callback(null, true);
        }
      } catch {
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Key", "Accept"]
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api", apiLimiter);
app.use("/uploads", express.static(uploadDir2));
var healthHandler = (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || (isServerless2 ? "production" : "development")
  });
};
app.get(["/api/health", "/api/v1/health", "/health"], healthHandler);
app.get(["/", "/api"], (_req, res) => {
  res.status(200).json({
    name: "EcoCity Smart Civic Issue Reporting System API",
    status: "online",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      reports: "/api/reports",
      auth: "/api/auth"
    }
  });
});
app.use("/api/reports", reportRoutes_default);
app.use("/api/v1/reports", reportRoutes_default);
app.use("/reports", reportRoutes_default);
app.use("/v1/reports", reportRoutes_default);
app.use("/api/complaints", reportRoutes_default);
app.use("/api/v1/complaints", reportRoutes_default);
app.use("/complaints", reportRoutes_default);
app.use("/v1/complaints", reportRoutes_default);
app.use("/api/admin/complaints", reportRoutes_default);
app.use("/api/v1/admin/complaints", reportRoutes_default);
app.use("/admin/complaints", reportRoutes_default);
app.use("/v1/admin/complaints", reportRoutes_default);
app.use("/api/auth", authRoutes_default);
app.use("/api/v1/auth", authRoutes_default);
app.use("/auth", authRoutes_default);
app.use("/v1/auth", authRoutes_default);
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});
app.use(errorHandler_default);
var hasSeededAdmin = false;
async function seedInitialAdmin() {
  if (hasSeededAdmin) return;
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@ecocity.com";
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();
    if (!adminPassword) {
      hasSeededAdmin = true;
      return;
    }
    const existingAdmin = await Admin_default.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await Admin_default.create({
        email: adminEmail,
        name: process.env.ADMIN_NAME || "EcoCity Administrator",
        password: adminPassword,
        role: "admin"
      });
      console.log(`[Auth] Initial administrator seeded for: ${adminEmail}`);
    }
    hasSeededAdmin = true;
  } catch (seedErr) {
    console.warn(`[Auth Seed Warning] Could not check or seed admin: ${seedErr.message}`);
  }
}
async function startServer() {
  try {
    await connectDB();
    await seedInitialAdmin();
    const server = app.listen(PORT, () => {
      console.log(`
==================================================`);
      console.log(`  EcoCity Civic Backend Server Running`);
      console.log(`  Port: http://localhost:${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Reports API:  http://localhost:${PORT}/api/reports`);
      console.log(`  Brevo Email:  ${process.env.BREVO_API_KEY ? "Configured" : "Missing BREVO_API_KEY"}`);
      console.log(`==================================================
`);
    });
    return server;
  } catch (error) {
    console.error(`[Server Start Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
}
var isDirectExecution = Boolean(
  process.argv[1] && (process.argv[1].endsWith(path3.join("server", "index.ts")) || process.argv[1].endsWith(path3.join("server", "index.js")) || process.argv[1].endsWith("index.ts") || process.argv[1].endsWith("index.js"))
);
if (isDirectExecution && process.env.NODE_ENV !== "test" && !isServerless2) {
  startServer();
}
var server_default = app;

// serverless/index.ts
async function handler(req, res) {
  const requestPath = new URL(req.url || "/", "http://localhost").pathname;
  const isHealthCheck = ["/api/health", "/api/v1/health", "/health"].includes(requestPath);
  if (!isHealthCheck) {
    try {
      await connectDB();
    } catch (error) {
      console.error("[Serverless Handler] Database connection failed:", error);
      return res.status(500).json({
        status: "error",
        message: "Database connection failed"
      });
    }
  }
  return server_default(req, res);
}
export {
  handler as default
};
