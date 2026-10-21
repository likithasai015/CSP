import { BrevoClient } from '@getbrevo/brevo';
import axios from 'axios';
import dotenv from 'dotenv';
import { IReportData } from './mockDataService.js';

export interface BrevoSendResult {
  sent: boolean;
  messageId?: string;
  statusCode?: number;
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
  /**
   * Safely retrieve the Brevo API key from supported environment variables,
   * stripping extraneous whitespace or surrounding quotes.
   */
  public static getApiKey(): string {
    const rawKey =
      process.env.BREVO_API_KEY ||
      process.env.SENDINBLUE_API_KEY ||
      process.env.BREVO_KEY ||
      process.env.BREVO_APIKEY ||
      '';
    return rawKey.trim().replace(/^["']|["']$/g, '');
  }

  /**
   * Check whether a non-dummy Brevo API key is available.
   */
  public static isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key !== 'your_brevo_api_key_here' && !key.startsWith('xkeysib-your_'));
  }

  /**
   * Retrieve the admin recipient email. Defaults to likithamindi024@gmail.com.
   */
  public static getAdminEmail(): string {
    const raw =
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      process.env.ADMIN_EMAIL ||
      '';
    const cleaned = raw.trim().replace(/^["']|["']$/g, '');
    if (!cleaned || cleaned.includes('yourdomain.com') || cleaned.includes('example.com')) {
      return 'likithamindi024@gmail.com';
    }
    return cleaned;
  }

  /**
   * Retrieve the verified Brevo sender email. Defaults to likithamindi024@gmail.com.
   */
  public static getSenderEmail(): string {
    const raw = process.env.BREVO_SENDER_EMAIL || '';
    const cleaned = raw.trim().replace(/^["']|["']$/g, '');
    if (!cleaned || cleaned.includes('yourdomain.com') || cleaned.includes('example.com')) {
      return 'likithamindi024@gmail.com';
    }
    return cleaned;
  }

  /**
   * Retrieve the sender display name. Defaults to EcoCity Civic System.
   */
  public static getSenderName(): string {
    const raw = process.env.BREVO_SENDER_NAME || '';
    const cleaned = raw.trim().replace(/^["']|["']$/g, '');
    return cleaned || 'EcoCity Civic System';
  }

  private static getClient(apiKey: string): BrevoClient | null {
    if (!apiKey) return null;
    try {
      return new BrevoClient({ apiKey });
    } catch {
      return null;
    }
  }

  /**
   * Generates a modern, responsive HTML email template for the civic issue report.
   * All user-supplied text fields are sanitized to prevent injection attacks.
   */
  public static generateComplaintEmailHtml(report: IReportData): string {
    const sanitizedName = escapeHtml(report.name || 'Citizen Reporter');
    const sanitizedEmail = escapeHtml(report.email);
    const sanitizedLocation = escapeHtml(report.locationName);
    const sanitizedCategory = escapeHtml(report.category || 'Garbage');
    const sanitizedDepartment = escapeHtml(report.department || 'Sanitation Department');
    const sanitizedContact = escapeHtml(report.contact);
    const sanitizedDescription = escapeHtml(report.description);
    const sanitizedComplaintId = escapeHtml(report.complaintId);
    const sanitizedTitle = escapeHtml(report.title || 'Civic Issue');

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
  <title>New Civic Issue Report — EcoCity</title>
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
      <h1>New Civic Issue Report — EcoCity</h1>
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
        <div class="card-title">&bull; Incident Location &amp; Coordinates</div>
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
      ${
        report.photoUrl
          ? `<div class="card">
              <div class="card-title">&bull; Photographic Evidence</div>
              ${
                report.photoUrl.startsWith('data:')
                  ? `<div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; text-align: center;">
                      <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #166534;">📎 Incident Photo Attached</p>
                      <p style="margin: 0; font-size: 12.5px; color: #4B5563;">A high-resolution photograph taken at the incident location is attached directly to this notification email: <strong>evidence-${sanitizedComplaintId}.jpg</strong></p>
                    </div>`
                  : `<p style="font-size: 13px; color: #64748B; margin-top: 0;">Uploaded photo taken at the incident location:</p>
                    <div class="image-container">
                      <img src="${escapeHtml(report.photoUrl)}" alt="Civic Issue Evidence" />
                    </div>
                    <a href="${escapeHtml(report.photoUrl)}" target="_blank" class="view-image-link">Click here to view or download full-size photo &nearr;</a>`
              }
            </div>`
          : ''
      }
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
  public static async sendComplaintNotification(report: IReportData): Promise<BrevoSendResult> {
    const apiKey = this.getApiKey();
    const adminEmail = this.getAdminEmail();
    const senderEmail = this.getSenderEmail();
    const senderName = this.getSenderName();

    console.log('[Brevo Diagnostic] Initiating transactional email dispatch...');
    console.log(`[Brevo Diagnostic] API Key present: ${Boolean(apiKey && apiKey !== 'your_brevo_api_key_here')}`);
    console.log(`[Brevo Diagnostic] Sender: ${senderEmail} ("${senderName}")`);
    console.log(`[Brevo Diagnostic] Recipient: ${adminEmail}`);
    console.log(`[Brevo Diagnostic] Complaint ID: ${report.complaintId || 'N/A'}`);

    // 1. Guard check for configuration
    if (!this.isConfigured()) {
      const msg = 'Brevo API key is not configured in environment variables (BREVO_API_KEY). Email delivery skipped.';
      console.warn(`[Brevo Diagnostic] ${msg}`);
      return { sent: false, error: msg };
    }

    if (!adminEmail || adminEmail === '') {
      const msg = 'Administrator recipient email is not configured. Email delivery skipped.';
      console.warn(`[Brevo Diagnostic] ${msg}`);
      return { sent: false, error: msg };
    }

    // Exact subject required by specifications
    const subject = 'New Civic Issue Report — EcoCity';
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
      ]
    };

    if (report.email && /^\S+@\S+\.\S+$/.test(report.email)) {
      emailPayload.replyTo = {
        email: report.email,
        name: report.name || 'Citizen Reporter'
      };
    }

    // Handle photo attachment safely
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
          name: `evidence-${report.complaintId || 'photo'}.jpg`
        }
      ];
    } else if (report.photoUrl && report.photoUrl.startsWith('data:')) {
      const commaIndex = report.photoUrl.indexOf(',');
      if (commaIndex !== -1) {
        const meta = report.photoUrl.substring(0, commaIndex);
        const base64Content = report.photoUrl.substring(commaIndex + 1).replace(/\s/g, '');
        const ext = meta.includes('png') ? 'png' : meta.includes('webp') ? 'webp' : 'jpg';

        // Brevo single attachment limit is 4 MB (approx. 5.3 MB base64 characters)
        if (base64Content.length <= 5 * 1024 * 1024) {
          emailPayload.attachment = [
            {
              content: base64Content,
              name: `evidence-${report.complaintId || 'photo'}.${ext}`
            }
          ];
        } else {
          console.warn(
            `[Brevo Diagnostic] Evidence photo size (${Math.round(base64Content.length / 1024)} KB) exceeds 4 MB attachment limit; sending notification email without file attachment.`
          );
        }
      }
    }

    console.log(`[Brevo Diagnostic] Attachment count: ${emailPayload.attachment ? emailPayload.attachment.length : 0}`);

    // 3. Attempt delivery via official BrevoClient SDK with direct REST API v3 fallback
    try {
      const client = this.getClient(apiKey);
      let messageId: string | undefined;
      let statusCode = 201;
      let accepted = false;

      if (client && typeof client.transactionalEmails?.sendTransacEmail === 'function') {
        try {
          const response: any = await client.transactionalEmails.sendTransacEmail(emailPayload);
          statusCode = response?.rawResponse?.status || 201;
          messageId =
            response?.data?.messageId ||
            (Array.isArray(response?.data?.messageIds) && response.data.messageIds[0]) ||
            response?.messageId ||
            response?.body?.messageId;
          accepted = true;
        } catch (sdkError: any) {
          console.warn(
            `[Brevo Diagnostic] Brevo SDK attempt returned: ${sdkError.message || 'error'}. Attempting REST API fallback...`
          );
        }
      }

      if (!accepted) {
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailPayload, {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          timeout: 15000
        });
        statusCode = response.status;
        messageId =
          response.data?.messageId ||
          (Array.isArray(response.data?.messageIds) && response.data.messageIds[0]) ||
          'brevo-accepted';
        accepted = true;
      }

      const finalMessageId = messageId || 'brevo-accepted';
      console.log(`[Brevo Diagnostic] HTTP Status code: ${statusCode}`);
      console.log(`[Brevo Diagnostic] Brevo Message ID: ${finalMessageId}`);
      console.log(`[Brevo Diagnostic] Request successfully accepted by Brevo for delivery to ${adminEmail}. Note: Final delivery is processed asynchronously by Brevo SMTP relay servers.`);

      return {
        sent: true,
        messageId: finalMessageId,
        statusCode
      };
    } catch (error: any) {
      const statusCode =
        error.statusCode ||
        error.status ||
        error.response?.status ||
        (String(error.message).includes('403') ? 403 : String(error.message).includes('401') ? 401 : 500);

      let cleanMsg =
        error.response?.data?.message ||
        error.body?.message ||
        (typeof error.body === 'string' ? error.body : null) ||
        error.message ||
        'Unknown Brevo error';

      if (typeof cleanMsg === 'string') {
        if (cleanMsg.includes('transactional.email')) {
          cleanMsg = 'API key is not authorized for resource "transactional.email" (permission_denied). In Brevo Dashboard -> Settings -> SMTP & API -> API Keys, generate a key with Transactional Email permissions.';
        } else if (cleanMsg.includes('sender') && (cleanMsg.includes('unverified') || cleanMsg.includes('not exist') || cleanMsg.includes('invalid'))) {
          cleanMsg = `Sender email "${senderEmail}" is not verified in Brevo. Verify this sender in Brevo Dashboard -> Senders & IP -> Senders.`;
        } else if (cleanMsg.startsWith('Status code:')) {
          try {
            const match = cleanMsg.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              cleanMsg = parsed.message || cleanMsg;
            }
          } catch {
            // keep original
          }
        }
      }

      console.error(`[Brevo Diagnostic] HTTP Status code: ${statusCode}`);
      console.error(`[Brevo Diagnostic] Email rejected / failed by Brevo: ${cleanMsg}`);

      return {
        sent: false,
        statusCode,
        error: cleanMsg
      };
    }
  }
}

export default BrevoService;
