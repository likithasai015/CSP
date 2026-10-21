// server/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import path3 from "path";
import fs3 from "fs";
import os2 from "os";
import mongoose4 from "mongoose";

// server/config/db.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
var connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI environment variable is missing");
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1e4
    });
    console.log("MongoDB connected successfully");
    console.log(`Database: ${mongoose.connection.name}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("MongoDB connection failed:", {
        name: error.name,
        message: error.message
      });
    } else {
      console.error("MongoDB connection failed with an unknown error");
    }
    throw error;
  }
};
var db_default = connectDB;

// server/routes/reportRoutes.ts
import { Router } from "express";

// server/controllers/reportController.ts
import mongoose3 from "mongoose";

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
   * Process uploaded photo:
   * 1. If Cloudinary is configured, uploads to Cloudinary CDN.
   * 2. Otherwise converts the uploaded file into a persistent, self-contained Data URI.
   *    This guarantees that photos render instantly, never 404 on Vercel's ephemeral
   *    filesystem, and are durable within the in-memory mock store.
   */
  static async processUploadedFile(file, _reqHost, _protocol) {
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
        console.warn(`[Storage] Cloudinary upload failed (${err.message}). Falling back to self-contained Data URI.`);
      }
    }
    try {
      if (file.path && fs.existsSync(file.path)) {
        const fileBuffer = fs.readFileSync(file.path);
        const mimeType = file.mimetype || "image/jpeg";
        const dataUri = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
        if (isServerless3) {
          try {
            fs.unlinkSync(file.path);
          } catch {
          }
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
    const filename = path.basename(file.path);
    return {
      url: `/uploads/${filename}`,
      publicId: filename
    };
  }
};
var storageService_default = StorageService;

// server/services/brevoService.ts
import { BrevoClient } from "@getbrevo/brevo";
import axios from "axios";
import dotenv2 from "dotenv";
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
   * Generates a modern, responsive HTML email template for the civic issue report.
   * All user-supplied text fields are sanitized to prevent injection attacks.
   */
  static generateComplaintEmailHtml(report) {
    const sanitizedName = escapeHtml(report.name || "Citizen Reporter");
    const sanitizedEmail = escapeHtml(report.email);
    const sanitizedLocation = escapeHtml(report.locationName);
    const sanitizedCategory = escapeHtml(report.category || "Garbage");
    const sanitizedDepartment = escapeHtml(report.department || "Sanitation Department");
    const sanitizedContact = escapeHtml(report.contact);
    const sanitizedDescription = escapeHtml(report.description);
    const sanitizedComplaintId = escapeHtml(report.complaintId);
    const sanitizedTitle = escapeHtml(report.title || "Civic Issue");
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
  <title>New Civic Issue Report \u2014 EcoCity</title>
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
      min-width: 140px;
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
      <h1>New Civic Issue Report \u2014 EcoCity</h1>
      <p>Automated Municipal Alert &bull; ${sanitizedDepartment}</p>
      <div class="badge">Report ID: ${sanitizedComplaintId}</div>
    </div>

    <div class="content">
      <div class="alert-banner">
        <strong>Action Required:</strong> A citizen has submitted a new civic issue report. Please inspect the details below and dispatch a municipal unit or update the status accordingly.
      </div>

      <!-- Incident Overview -->
      <div class="card">
        <div class="card-title">&bull; Report Overview</div>
        <div class="field-row">
          <span class="field-label">Issue Title:</span>
          <span class="field-value">${sanitizedTitle}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Category:</span>
          <span class="field-value" style="color: #0F766E;">${sanitizedCategory}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Department:</span>
          <span class="field-value">${sanitizedDepartment}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Initial Status:</span>
          <span class="field-value" style="color: #D97706;">Pending Verification</span>
        </div>
        <div class="field-row">
          <span class="field-label">Submission Date:</span>
          <span class="field-value">${formattedDate}</span>
        </div>
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
        <div class="card-title">&bull; Incident Location &amp; Coordinates</div>
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
      ${report.photoUrl ? `<div class="card">
              <div class="card-title">&bull; Photographic Evidence</div>
              <p style="font-size: 13px; color: #64748B; margin-top: 0;">Uploaded photo taken at the incident location:</p>
              <div class="image-container">
                <img src="${report.photoUrl}" alt="Civic Issue Evidence" />
              </div>
              ${report.photoUrl.startsWith("data:") ? '<p style="font-size: 12px; color: #64748B; margin-top: 8px;">High-resolution evidence file is attached directly to this email notification.</p>' : `<a href="${report.photoUrl}" target="_blank" class="view-image-link">Click here to view or download full-size photo &nearr;</a>`}
            </div>` : ""}
    </div>

    <div class="footer">
      <p><strong>EcoCity Smart Civic Engagement Platform</strong></p>
      <p>This automated notification was dispatched via Brevo Transactional Email Service.</p>
      <p>To inspect or update this issue, log in to the EcoCity Admin Console.</p>
    </div>
  </div>
</body>
</html>`;
  }
  /**
   * Sends the transactional email to the administrator using Brevo API.
   * Subject: "New Civic Issue Report — EcoCity"
   * Recipient: likithamindi024@gmail.com
   */
  static async sendComplaintNotification(report) {
    dotenv2.config({ override: true });
    const apiKey = process.env.BREVO_API_KEY?.trim();
    const adminEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || "likithamindi024@gmail.com").trim();
    const senderEmail = (process.env.BREVO_SENDER_EMAIL || "likithamindi024@gmail.com").trim();
    const senderName = process.env.BREVO_SENDER_NAME?.trim() || "EcoCity Civic System";
    if (!apiKey || apiKey === "" || apiKey === "your_brevo_api_key_here") {
      const msg = "Brevo API key is not configured in environment variables (BREVO_API_KEY). Email delivery skipped.";
      console.warn(`[Brevo Notification] ${msg}`);
      return { sent: false, error: msg };
    }
    if (!adminEmail || adminEmail === "") {
      const msg = "Administrator recipient email is not configured. Email delivery skipped.";
      console.warn(`[Brevo Notification] ${msg}`);
      return { sent: false, error: msg };
    }
    const subject = "New Civic Issue Report \u2014 EcoCity";
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
          name: `report-${report.complaintId}.jpg`
        }
      ];
    } else if (report.photoUrl && report.photoUrl.startsWith("data:")) {
      const match = report.photoUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Content = match[2];
        const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
        emailPayload.attachment = [
          {
            content: base64Content,
            name: `evidence-${report.complaintId || "photo"}.${ext}`
          }
        ];
      }
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
      console.log(`[Brevo Notification] Successfully accepted by Brevo for delivery to ${adminEmail}. Message ID: ${messageId}`);
      return {
        sent: true,
        messageId
      };
    } catch (error) {
      const statusCode = error.statusCode || error.status || error.response?.status || (String(error.message).includes("403") ? 403 : 500);
      let cleanMsg = error.body?.message || error.response?.data?.message || error.message || "Unknown Brevo error";
      if (typeof cleanMsg === "string" && cleanMsg.includes("transactional.email")) {
        cleanMsg = 'API key is not authorized for resource "transactional.email" (permission_denied). In Brevo Dashboard -> Settings -> SMTP & API -> API Keys, generate a key with Transactional Email permissions.';
      } else if (typeof cleanMsg === "string" && cleanMsg.startsWith("Status code:")) {
        try {
          const match = cleanMsg.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            cleanMsg = parsed.message || cleanMsg;
          }
        } catch {
        }
      }
      console.error(`[Brevo Notification Failed] Status ${statusCode}: ${cleanMsg}`);
      return {
        sent: false,
        error: cleanMsg
      };
    }
  }
};
var brevoService_default = BrevoService;

// server/models/Report.ts
import mongoose2, { Schema } from "mongoose";
var ReportSchema = new Schema(
  {
    complaintId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    locationName: { type: String, required: true },
    latitude: Number,
    longitude: Number,
    description: { type: String, default: "" },
    title: { type: String, required: true },
    category: { type: String, default: "Garbage" },
    department: { type: String, required: true },
    contact: String,
    photoUrl: { type: String, required: true },
    photoPublicId: String,
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending"
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    },
    assignedDepartment: String,
    resolutionNotes: String,
    resolutionImage: String,
    emailNotification: {
      sent: { type: Boolean, default: false },
      messageId: String,
      error: String,
      attemptedAt: Date
    },
    location: String,
    img: String,
    user: String,
    userEmail: String,
    date: String
  },
  { timestamps: true }
);
var Report = mongoose2.models.Report || mongoose2.model("Report", ReportSchema);
var Report_default = Report;

// server/controllers/reportController.ts
var ReportModel = Report_default;
var allowedStatuses = ["Pending", "In Progress", "Resolved", "Rejected"];
var allowedPriorities = ["Low", "Medium", "High", "Critical"];
function toReportResponse(doc) {
  const report = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
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
function toBrevoReport(report) {
  return {
    ...report,
    _id: String(report._id),
    id: report.id || String(report._id),
    complaintId: report.complaintId,
    name: report.name,
    email: report.email,
    locationName: report.locationName,
    description: report.description || "",
    title: report.title,
    category: report.category,
    department: report.department,
    photoUrl: report.photoUrl,
    status: report.status,
    priority: report.priority,
    emailNotification: report.emailNotification || { sent: false },
    createdAt: report.createdAt || /* @__PURE__ */ new Date(),
    updatedAt: report.updatedAt || /* @__PURE__ */ new Date()
  };
}
async function findReport(id) {
  if (mongoose3.isValidObjectId(id)) {
    const byMongoId = await ReportModel.findById(id).exec();
    if (byMongoId) return byMongoId;
  }
  return ReportModel.findOne({
    $or: [{ id }, { complaintId: id }]
  }).exec();
}
var ReportController = class {
  /**
   * Submit a report and save it permanently in MongoDB.
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
      const citizenName = typeof name === "string" && name.trim() ? name.trim() : "Citizen Reporter";
      const citizenEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
      if (!citizenEmail) {
        res.status(400).json({
          success: false,
          message: "Citizen email is required"
        });
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(citizenEmail)) {
        res.status(400).json({
          success: false,
          message: "Please provide a valid email address"
        });
        return;
      }
      if (typeof locationName !== "string" || !locationName.trim()) {
        res.status(400).json({
          success: false,
          message: "Location name is required"
        });
        return;
      }
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "A photo of the civic issue is required"
        });
        return;
      }
      const parseCoordinate = (value, min, max) => {
        if (value === void 0 || value === null || value === "") {
          return void 0;
        }
        const number = Number(value);
        return Number.isFinite(number) && number >= min && number <= max ? number : void 0;
      };
      const reportCategory = typeof category === "string" && category.trim() ? category.trim() : "Garbage";
      const departmentMap = {
        Garbage: "Sanitation Department",
        Potholes: "Public Works Department",
        "Broken Streetlights": "Electrical Department",
        "Water Leakage": "Water Department",
        Drainage: "Sewer Department",
        "Stray Animal Issues": "Animal Control Department",
        "Illegal Tree Cutting": "Parks & Forestry Department",
        Pollution: "Environmental Protection Department"
      };
      const department = departmentMap[reportCategory] || "General Municipal Administration";
      const upload = await storageService_default.processUploadedFile(
        req.file,
        req.get("host"),
        req.protocol
      );
      const now = /* @__PURE__ */ new Date();
      const complaintId = `ECO-${Date.now()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const created = await ReportModel.create({
        complaintId,
        id: complaintId,
        name: citizenName,
        email: citizenEmail,
        locationName: locationName.trim(),
        latitude: parseCoordinate(latitude, -90, 90),
        longitude: parseCoordinate(longitude, -180, 180),
        description: typeof description === "string" ? description.trim() : "",
        title: typeof title === "string" && title.trim() ? title.trim() : `${reportCategory} Issue at ${locationName.trim()}`,
        category: reportCategory,
        department,
        assignedDepartment: department,
        contact: typeof contact === "string" && contact.trim() ? contact.trim() : void 0,
        photoUrl: upload.url,
        photoPublicId: upload.publicId,
        status: "Pending",
        priority: "Medium",
        emailNotification: { sent: false },
        location: locationName.trim(),
        img: upload.url,
        user: citizenName,
        userEmail: citizenEmail,
        date: now.toISOString()
      });
      let emailNotification;
      try {
        const emailResult = await brevoService_default.sendComplaintNotification(toBrevoReport(created));
        emailNotification = {
          sent: emailResult.sent,
          messageId: emailResult.messageId,
          error: emailResult.error,
          attemptedAt: /* @__PURE__ */ new Date()
        };
      } catch (emailError) {
        emailNotification = {
          sent: false,
          error: emailError instanceof Error ? emailError.message : "Email notification failed",
          attemptedAt: /* @__PURE__ */ new Date()
        };
      }
      created.emailNotification = emailNotification;
      await created.save();
      res.status(201).json({
        success: true,
        message: emailNotification.sent ? "Report saved to MongoDB and email notification accepted by Brevo" : "Report saved to MongoDB, but the email notification could not be sent",
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
  static async getAllReports(req, res, next) {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : void 0;
      const category = typeof req.query.category === "string" ? req.query.category : void 0;
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      const page = Math.max(
        1,
        Number.parseInt(String(req.query.page || "1"), 10) || 1
      );
      const limit = Math.max(
        1,
        Math.min(
          100,
          Number.parseInt(String(req.query.limit || "20"), 10) || 20
        )
      );
      const filter = {};
      if (status && status !== "all") {
        filter.status = status;
      }
      if (category && category !== "all") {
        filter.category = category;
      }
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");
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
      const sortOrder = req.query.sort === "oldest" ? 1 : -1;
      const [documents, total] = await Promise.all([
        ReportModel.find(filter).sort({ createdAt: sortOrder }).skip((page - 1) * limit).limit(limit).lean().exec(),
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
  static async getPublicRecentReports(_req, res, next) {
    try {
      const reports = await ReportModel.find().sort({ createdAt: -1 }).limit(10).lean().exec();
      const safeReports = reports.map((report) => {
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
  static async getReportById(req, res, next) {
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
  static async updateReportStatus(req, res, next) {
    try {
      const {
        status,
        notes,
        assignedDepartment,
        priority,
        resolutionImage
      } = req.body;
      const updates = {};
      if (status !== void 0) {
        if (!allowedStatuses.includes(status)) {
          res.status(400).json({
            success: false,
            message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
          });
          return;
        }
        updates.status = status;
      }
      if (assignedDepartment !== void 0) {
        updates.assignedDepartment = assignedDepartment;
      }
      if (notes !== void 0) {
        updates.resolutionNotes = notes;
      }
      if (resolutionImage !== void 0) {
        updates.resolutionImage = resolutionImage;
      }
      if (priority !== void 0) {
        if (!allowedPriorities.includes(priority)) {
          res.status(400).json({
            success: false,
            message: `Invalid priority. Allowed values: ${allowedPriorities.join(", ")}`
          });
          return;
        }
        updates.priority = priority;
      }
      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          message: "No valid report fields supplied for update"
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
        message: "Report updated successfully",
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
  static async resendNotification(req, res, next) {
    try {
      const report = await findReport(req.params.id);
      if (!report) {
        res.status(404).json({
          success: false,
          message: `Civic issue report not found with ID ${req.params.id}`
        });
        return;
      }
      const emailResult = await brevoService_default.sendComplaintNotification(toBrevoReport(report));
      report.emailNotification = {
        sent: emailResult.sent,
        messageId: emailResult.messageId,
        error: emailResult.error,
        attemptedAt: /* @__PURE__ */ new Date()
      };
      await report.save();
      res.status(200).json({
        success: true,
        message: emailResult.sent ? "Email notification resent successfully" : "Email sending failed",
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
  static async getStats(_req, res, next) {
    try {
      const [total, pending, inProgress, resolved, rejected] = await Promise.all([
        ReportModel.countDocuments().exec(),
        ReportModel.countDocuments({ status: "Pending" }).exec(),
        ReportModel.countDocuments({ status: "In Progress" }).exec(),
        ReportModel.countDocuments({ status: "Resolved" }).exec(),
        ReportModel.countDocuments({ status: "Rejected" }).exec()
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
router.get("/stats", requireAdmin, reportController_default.getStats);
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

// server/services/mockDataService.ts
var MockDataService = class {
  constructor() {
    this.reports = [];
    this.seedDefaultReports();
  }
  /**
   * Initialize realistic civic reports for demonstration
   */
  seedDefaultReports() {
    const defaultReports = [
      {
        _id: "rep-seed-1",
        id: "rep-seed-1",
        complaintId: "ECO-10001",
        title: "Garbage Overflow",
        category: "Garbage",
        status: "Pending",
        locationName: "Sector 4 Market, Main Square",
        location: "Sector 4 Market, Main Square",
        latitude: 17.4399,
        longitude: 78.4982,
        name: "Alex Walker",
        user: "Alex Walker",
        email: "alex.walker@gmail.com",
        userEmail: "alex.walker@gmail.com",
        contact: "+91 98765 43210",
        description: "Severe garbage overflow spilling out of the municipal dustbin with excessive waste and plastic accumulated on the pedestrian pavement.",
        department: "Sanitation Department",
        assignedDepartment: "Sanitation Department",
        priority: "High",
        photoUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=1200",
        photoPublicId: "report-1792070984340-abe79d636034dd90.jpg",
        img: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=1200",
        emailNotification: {
          sent: true,
          messageId: "seed-notif-1",
          attemptedAt: new Date(Date.now() - 36e5 * 24 * 2)
        },
        createdAt: new Date(Date.now() - 36e5 * 24 * 2),
        updatedAt: new Date(Date.now() - 36e5 * 24 * 2)
      },
      {
        _id: "rep-seed-2",
        id: "rep-seed-2",
        complaintId: "ECO-10002",
        title: "Broken Streetlight",
        category: "Broken Streetlights",
        status: "Resolved",
        locationName: "Oak Wood Avenue, Pole #42",
        location: "Oak Wood Avenue, Pole #42",
        latitude: 17.4412,
        longitude: 78.4915,
        name: "Sarah Jenkins",
        user: "Sarah Jenkins",
        email: "sarah.j@gmail.com",
        userEmail: "sarah.j@gmail.com",
        contact: "+91 98123 45678",
        description: "The street light in front of house 42 has been flickering and is now completely out, making the corner dangerous at night.",
        department: "Electrical Department",
        assignedDepartment: "Electrical Department",
        priority: "Medium",
        resolutionNotes: "Replaced LED bulb assembly and checked underground cabling. Lamp restored.",
        photoUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200",
        photoPublicId: "report-1792071173419-33e78100399624c2.jpg",
        img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200",
        emailNotification: {
          sent: true,
          messageId: "seed-notif-2",
          attemptedAt: new Date(Date.now() - 36e5 * 24 * 5)
        },
        createdAt: new Date(Date.now() - 36e5 * 24 * 5),
        updatedAt: new Date(Date.now() - 36e5 * 12)
      },
      {
        _id: "rep-seed-3",
        id: "rep-seed-3",
        complaintId: "ECO-10003",
        title: "Dangerous Pothole on 5th Cross Road",
        category: "Potholes",
        status: "In Progress",
        locationName: "5th Cross Road, Near Central Library",
        location: "5th Cross Road, Near Central Library",
        latitude: 17.435,
        longitude: 78.489,
        name: "Marcus Vance",
        user: "Marcus Vance",
        email: "marcus.v@ecocity.org",
        userEmail: "marcus.v@ecocity.org",
        description: "Deep road depression causing two-wheelers to swerve dangerously during peak evening hours.",
        department: "Public Works Department",
        assignedDepartment: "Public Works Department",
        priority: "High",
        photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=1200",
        photoPublicId: "report-1792071909470-602d96b2ea54128d.jpg",
        img: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=1200",
        emailNotification: {
          sent: true,
          messageId: "seed-notif-3",
          attemptedAt: new Date(Date.now() - 36e5 * 24 * 1)
        },
        createdAt: new Date(Date.now() - 36e5 * 24 * 1),
        updatedAt: new Date(Date.now() - 36e5 * 4)
      },
      {
        _id: "rep-seed-4",
        id: "rep-seed-4",
        complaintId: "ECO-10004",
        title: "Water Leakage from Main Supply Pipe",
        category: "Water Leakage",
        status: "Pending",
        locationName: "Riverside Boulevard, Near Block 3",
        location: "Riverside Boulevard, Near Block 3",
        latitude: 17.448,
        longitude: 78.502,
        name: "Priya Sharma",
        user: "Priya Sharma",
        email: "priya.sharma@gmail.com",
        userEmail: "priya.sharma@gmail.com",
        description: "Continuous clean water escaping from joint in distribution main, flooding adjacent walking path.",
        department: "Water Department",
        assignedDepartment: "Water Department",
        priority: "Medium",
        photoUrl: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=1200",
        photoPublicId: "report-1792075974281-1f975a02bfb931c5.jpg",
        img: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=1200",
        emailNotification: {
          sent: true,
          messageId: "seed-notif-4",
          attemptedAt: new Date(Date.now() - 36e5 * 10)
        },
        createdAt: new Date(Date.now() - 36e5 * 10),
        updatedAt: new Date(Date.now() - 36e5 * 10)
      }
    ];
    this.reports = defaultReports;
  }
  // ==========================================
  // Administrator In-Memory Management
  // ==========================================
  getAdminConfig() {
    return {
      email: (process.env.ADMIN_EMAIL || "likithamindi024@gmail.com").trim().toLowerCase(),
      password: (process.env.ADMIN_PASSWORD || "likitha123").trim(),
      name: (process.env.ADMIN_NAME || "EcoCity Administrator").trim()
    };
  }
  validateAdminCredentials(emailInput, passwordInput) {
    if (!emailInput || !passwordInput) return null;
    const config = this.getAdminConfig();
    const normalizedInput = emailInput.trim().toLowerCase();
    if (normalizedInput === config.email && passwordInput.trim() === config.password) {
      return {
        id: "admin-master-1",
        _id: "admin-master-1",
        name: config.name,
        email: config.email,
        role: "admin",
        createdAt: /* @__PURE__ */ new Date("2026-01-01T00:00:00.000Z")
      };
    }
    return null;
  }
  getAdminById(id) {
    const config = this.getAdminConfig();
    return {
      id: id || "admin-master-1",
      _id: id || "admin-master-1",
      name: config.name,
      email: config.email,
      role: "admin",
      createdAt: /* @__PURE__ */ new Date("2026-01-01T00:00:00.000Z")
    };
  }
  // ==========================================
  // Reports In-Memory Management
  // ==========================================
  createReport(data) {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(1e3 + Math.random() * 9e3);
    const complaintId = data.complaintId || `ECO-${timestamp}-${randomNum}`;
    const id = `report-${Date.now()}-${randomNum}`;
    const now = /* @__PURE__ */ new Date();
    const report = {
      _id: id,
      id,
      complaintId,
      name: data.name,
      user: data.name,
      email: data.email.toLowerCase(),
      userEmail: data.email.toLowerCase(),
      locationName: data.locationName,
      location: data.locationName,
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description || "",
      title: data.title || `Issue at ${data.locationName}`,
      category: data.category || "Garbage",
      department: data.department || "Sanitation Department",
      assignedDepartment: data.assignedDepartment || data.department || "Sanitation Department",
      contact: data.contact,
      photoUrl: data.photoUrl,
      photoPublicId: data.photoPublicId,
      img: data.photoUrl,
      status: data.status || "Pending",
      priority: data.priority || "Medium",
      emailNotification: {
        sent: false,
        attemptedAt: now
      },
      createdAt: now,
      updatedAt: now
    };
    this.reports.unshift(report);
    return report;
  }
  getAllReports(filter) {
    let result = [...this.reports];
    if (filter.status && filter.status !== "All") {
      result = result.filter((r) => r.status.toLowerCase() === filter.status.toLowerCase());
    }
    if (filter.category && filter.category !== "All") {
      result = result.filter((r) => r.category.toLowerCase() === filter.category.toLowerCase());
    }
    if (filter.search && filter.search.trim() !== "") {
      const q = filter.search.trim().toLowerCase();
      result = result.filter(
        (r) => r.complaintId.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.locationName.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      );
    }
    if (filter.sort === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const total = result.length;
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;
    const pagedReports = result.slice(skip, skip + limit);
    return {
      reports: pagedReports,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }
  getPublicRecentReports(limit = 10) {
    const sorted = [...this.reports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const sliced = sorted.slice(0, limit);
    return sliced.map((r) => {
      const { email, contact, userEmail, ...sanitized } = r;
      return sanitized;
    });
  }
  getReportById(id) {
    if (!id) return null;
    const cleanId = String(id).trim().toLowerCase();
    const found = this.reports.find(
      (r) => r._id.toLowerCase() === cleanId || r.id.toLowerCase() === cleanId || r.complaintId.toLowerCase() === cleanId
    );
    return found || null;
  }
  updateReportStatus(id, updates) {
    const report = this.getReportById(id);
    if (!report) return null;
    if (updates.status) report.status = updates.status;
    if (updates.notes !== void 0) report.resolutionNotes = updates.notes;
    if (updates.assignedDepartment !== void 0) {
      report.assignedDepartment = updates.assignedDepartment;
      report.department = updates.assignedDepartment;
    }
    if (updates.priority) report.priority = updates.priority;
    if (updates.resolutionImage) report.resolutionImage = updates.resolutionImage;
    report.updatedAt = /* @__PURE__ */ new Date();
    return report;
  }
  updateEmailNotification(id, emailNotification) {
    const report = this.getReportById(id);
    if (report) {
      report.emailNotification = emailNotification;
    }
  }
  getStats() {
    return {
      total: this.reports.length,
      pending: this.reports.filter((r) => r.status === "Pending").length,
      inProgress: this.reports.filter((r) => r.status === "In Progress").length,
      resolved: this.reports.filter((r) => r.status === "Resolved").length,
      rejected: this.reports.filter((r) => r.status === "Rejected").length
    };
  }
};
var mockDataService = new MockDataService();
var mockDataService_default = mockDataService;

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
      const admin = mockDataService_default.validateAdminCredentials(email, password);
      if (!admin) {
        res.status(401).json({
          success: false,
          message: "Invalid administrator email or password"
        });
        return;
      }
      const jwtSecret = process.env.JWT_SECRET || "ecocity-default-jwt-secret-key-change-in-production";
      const token = jwt2.sign(
        {
          id: admin.id,
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
          id: admin.id,
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
      if (!req.user || req.user.role !== "admin") {
        res.status(401).json({
          success: false,
          message: "Not authenticated as administrator"
        });
        return;
      }
      const admin = mockDataService_default.getAdminById(req.user.id);
      res.status(200).json({
        success: true,
        user: {
          id: admin ? admin.id : req.user.id,
          name: admin ? admin.name : "EcoCity Administrator",
          email: admin ? admin.email : req.user.email,
          role: "admin"
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

// server/adminAuth.ts
import { Router as Router3 } from "express";
import jwt3 from "jsonwebtoken";
var router3 = Router3();
var getJwtSecret = () => {
  return process.env.JWT_SECRET || "ecocity-default-jwt-secret-key-change-in-production";
};
router3.post("/login", async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Both email and password are required"
      });
    }
    const admin = mockDataService_default.validateAdminCredentials(email, password);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid administrator email or password"
      });
    }
    const secret = getJwtSecret();
    const token = jwt3.sign(
      {
        id: admin.id,
        role: "admin",
        email: admin.email
      },
      secret,
      { expiresIn: "7d" }
    );
    return res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Admin login failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to log in"
    });
  }
});
var adminAuth_default = router3;

// server/index.ts
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
var isServerless2 = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);
var uploadDir2 = isServerless2 ? path3.join(os2.tmpdir(), "ecocity-uploads") : path3.resolve(process.cwd(), "uploads");
try {
  if (!fs3.existsSync(uploadDir2)) {
    fs3.mkdirSync(uploadDir2, { recursive: true });
  }
} catch (error) {
  console.error("[Uploads] Could not create upload directory:", error);
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
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Admin-Key",
      "Accept"
    ]
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api", apiLimiter);
app.use("/api/admin", adminAuth_default);
app.use(["/uploads", "/api/uploads"], express.static(uploadDir2));
app.get(
  ["/uploads/:filename", "/api/uploads/:filename"],
  (req, res) => {
    const filename = path3.basename(req.params.filename || "");
    const candidateDirs = [
      uploadDir2,
      path3.resolve(process.cwd(), "uploads"),
      path3.resolve(
        process.cwd(),
        "EcoCity-Smart-Civic-Issue-Reporting-System",
        "uploads"
      )
    ];
    for (const dir of candidateDirs) {
      const fullPath = path3.join(dir, filename);
      if (fs3.existsSync(fullPath)) {
        try {
          if (fs3.statSync(fullPath).size > 100) {
            return res.sendFile(fullPath);
          }
        } catch {
        }
      }
    }
    return res.redirect(
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800"
    );
  }
);
var healthHandler = (_req, res) => {
  const connected = mongoose4.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "healthy" : "unavailable",
    database: connected ? "MongoDB connected" : "MongoDB disconnected",
    databaseName: connected ? mongoose4.connection.name : null,
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
    mode: "MongoDB",
    endpoints: {
      health: "/api/health",
      reports: "/api/reports",
      auth: "/api/auth"
    }
  });
});
app.post(["/", "/api"], (req, res, next) => {
  reportRoutes_default(req, res, next);
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
async function startServer() {
  try {
    await db_default();
    const adminConfig = mockDataService_default.getAdminConfig();
    const server = app.listen(PORT, () => {
      console.log("\n==============================================");
      console.log(" EcoCity Smart Civic Issue Reporting Backend");
      console.log(" Mode: MongoDB");
      console.log(` Database: ${mongoose4.connection.name}`);
      console.log(` Port: http://localhost:${PORT}`);
      console.log(` Health: http://localhost:${PORT}/api/health`);
      console.log(` Reports: http://localhost:${PORT}/api/reports`);
      console.log(` Admin Email: ${adminConfig.email}`);
      console.log(
        ` Brevo Email: ${process.env.BREVO_API_KEY ? "Configured" : "Missing BREVO_API_KEY"}`
      );
      console.log("==============================================\n");
    });
    return server;
  } catch (error) {
    console.error(
      "[Server Start Error] MongoDB connection failed:",
      error.message
    );
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
var dbConnectionPromise = null;
async function ensureDatabaseConnection() {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().catch((error) => {
      dbConnectionPromise = null;
      throw error;
    });
  }
  await dbConnectionPromise;
}
async function handler(req, res) {
  const matchedPath = req.headers["x-matched-path"] || req.headers["x-vercel-matched-path"];
  if (matchedPath && (req.url === "/api" || req.url === "/" || req.url?.startsWith("/api?"))) {
    req.url = matchedPath;
  }
  try {
    await ensureDatabaseConnection();
    return server_default(req, res);
  } catch (error) {
    console.error("Vercel API initialization failed:", error);
    return res.status(503).json({
      success: false,
      message: "Database connection unavailable. Please try again later."
    });
  }
}
export {
  handler as default
};
