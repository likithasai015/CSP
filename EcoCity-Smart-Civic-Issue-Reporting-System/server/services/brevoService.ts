import { BrevoClient } from '@getbrevo/brevo';
import axios from 'axios';
import dotenv from 'dotenv';
import { IReport } from '../models/Report.js';

export interface BrevoSendResult {
  sent: boolean;
  messageId?: string;
  error?: string;
}

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class BrevoService {
  private static getClient(): BrevoClient | null {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_brevo_api_key_here') {
      return null;
    }
    return new BrevoClient({ apiKey: apiKey.trim() });
  }

  /**
   * Generates a modern, responsive HTML email template for the garbage complaint.
   * All user-supplied text fields are rigorously sanitized to prevent injection attacks.
   */
  public static generateComplaintEmailHtml(report: IReport): string {
    const sanitizedName = escapeHtml(report.name || 'Citizen Reporter');
    const sanitizedEmail = escapeHtml(report.email);
    const sanitizedLocation = escapeHtml(report.locationName);
    const sanitizedContact = escapeHtml(report.contact);
    const sanitizedDescription = escapeHtml(report.description);
    const sanitizedComplaintId = escapeHtml(report.complaintId);

    const coordinatesText =
      report.latitude !== undefined && report.longitude !== undefined
        ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`
        : null;

    const mapsUrl = coordinatesText
      ? `https://www.google.com/maps?q=${report.latitude},${report.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.locationName)}`;

    const formattedDate = report.createdAt
      ? new Date(report.createdAt).toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'short'
        })
      : new Date().toLocaleString('en-US');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Garbage Complaint Received – EcoCity</title>
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
        ${
          sanitizedContact
            ? `<div class="field-row">
                <span class="field-label">Contact Number:</span>
                <span class="field-value">${sanitizedContact}</span>
              </div>`
            : ''
        }
      </div>

      <!-- Incident Location -->
      <div class="card">
        <div class="card-title">&bull; Incident Location &amp; Timestamp</div>
        <div class="field-row">
          <span class="field-label">Location / Landmark:</span>
          <span class="field-value">${sanitizedLocation}</span>
        </div>
        ${
          coordinatesText
            ? `<div class="field-row">
                <span class="field-label">GPS Coordinates:</span>
                <span class="field-value">${coordinatesText}</span>
              </div>`
            : `<div class="field-row">
                <span class="field-label">GPS Coordinates:</span>
                <span class="field-value" style="color: #94A3B8; font-style: italic;">Not captured (Manual address provided)</span>
              </div>`
        }
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
          ${sanitizedDescription || 'No additional description was provided by the citizen.'}
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
  public static async sendComplaintNotification(report: IReport): Promise<BrevoSendResult> {
    dotenv.config({ override: true });
    const apiKey = process.env.BREVO_API_KEY?.trim();
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || 'notifications@ecocity.org';
    const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'EcoCity Civic System';

    // 1. Guard check for required configuration
    if (!apiKey || apiKey === '' || apiKey === 'your_brevo_api_key_here') {
      const msg = 'Brevo API key is not configured in environment variables (BREVO_API_KEY). Email notification skipped.';
      console.warn(`[Brevo Notification] ${msg}`);
      return { sent: false, error: msg };
    }

    if (!adminEmail || adminEmail === '' || adminEmail === 'admin@yourdomain.com') {
      const msg = 'Administrator email is not configured in environment variables (ADMIN_EMAIL). Email notification skipped.';
      console.warn(`[Brevo Notification] ${msg}`);
      return { sent: false, error: msg };
    }

    const subject = `New Garbage Complaint Received – EcoCity [${report.complaintId}]`;
    const htmlContent = this.generateComplaintEmailHtml(report);

    // 2. Prepare payload
    const emailPayload: any = {
      subject,
      htmlContent,
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: adminEmail,
          name: 'EcoCity Administrator'
        }
      ],
      replyTo: {
        email: report.email,
        name: report.name
      }
    };

    // If photoUrl is an accessible public CDN URL ending with a standard image extension, attach it safely;
    // otherwise the high-resolution photo is clickable and viewable directly via the secure link in the HTML template.
    if (
      report.photoUrl &&
      report.photoUrl.startsWith('https://') &&
      !report.photoUrl.includes('localhost') &&
      !report.photoUrl.includes('127.0.0.1') &&
      /\.(jpg|jpeg|png|webp)($|\?)/i.test(report.photoUrl)
    ) {
      emailPayload.attachment = [
        {
          url: report.photoUrl,
          name: `complaint-${report.complaintId}.jpg`
        }
      ];
    }

    // 3. Attempt delivery via official BrevoClient or REST v3 fallback
    try {
      const client = this.getClient();
      let messageId: string | undefined;

      if (client && typeof client.transactionalEmails?.sendTransacEmail === 'function') {
        const response: any = await client.transactionalEmails.sendTransacEmail(emailPayload);
        // Brevo returns messageId on success
        messageId = response?.messageId || response?.body?.messageId || 'brevo-accepted';
      } else {
        // Direct Brevo REST API v3 call fallback
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailPayload, {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          timeout: 15000
        });
        messageId = response.data?.messageId || 'brevo-accepted';
      }

      console.log(`[Brevo Notification] Successfully sent email to ${adminEmail}. Message ID: ${messageId}`);
      return {
        sent: true,
        messageId
      };
    } catch (error: any) {
      // Safely extract error message without exposing API keys or secrets
      const brevoErrMsg =
        error.response?.data?.message ||
        error.response?.data?.code ||
        error.message ||
        'Unknown Brevo error';

      console.error(`[Brevo Notification Failed] Error sending to ${adminEmail}: ${brevoErrMsg}`);
      return {
        sent: false,
        error: `Brevo API error: ${brevoErrMsg}`
      };
    }
  }
}

export default BrevoService;
