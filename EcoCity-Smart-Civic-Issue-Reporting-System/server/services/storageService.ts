import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

export interface StorageUploadResult {
  url: string;
  publicId: string;
}

export class StorageService {
  private static isCloudinaryConfigured(): boolean {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    return !!(
      cloudName &&
      apiKey &&
      apiSecret &&
      cloudName !== 'your_cloud_name' &&
      apiKey !== 'your_api_key'
    );
  }

  /**
   * Upload an image file to Cloudinary if configured; otherwise generate a reliable URL.
   * In serverless environments (Vercel) without Cloudinary, converts the image buffer into a
   * self-contained Data URI so the image is persistently preserved in MongoDB and viewable.
   */
  public static async processUploadedFile(
    file: Express.Multer.File,
    reqHost?: string,
    protocol?: string
  ): Promise<StorageUploadResult> {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    // 1. Cloudinary upload when configured
    if (this.isCloudinaryConfigured()) {
      try {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
          api_key: process.env.CLOUDINARY_API_KEY?.trim(),
          api_secret: process.env.CLOUDINARY_API_SECRET?.trim()
        });

        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'ecocity/complaints',
          resource_type: 'image'
        });

        // Clean up temporary local file after uploading to Cloudinary
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch {
          // Ignore cleanup error
        }

        return {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        };
      } catch (err: any) {
        console.warn(`[Storage] Cloudinary upload failed (${err.message}). Falling back to local storage.`);
      }
    }

    // 2. Serverless fallback without Cloudinary: Embed as Data URI for durability
    if (isServerless) {
      try {
        if (file.path && fs.existsSync(file.path)) {
          const fileBuffer = fs.readFileSync(file.path);
          const mimeType = file.mimetype || 'image/jpeg';
          const dataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

          // Clean up /tmp file
          try {
            fs.unlinkSync(file.path);
          } catch {
            // Ignore cleanup error
          }

          const filename = path.basename(file.path);
          return {
            url: dataUri,
            publicId: filename
          };
        }
      } catch (readErr: any) {
        console.warn(`[Storage Warning] Could not encode file as Data URI: ${readErr.message}`);
      }
    }

    // 3. Local disk fallback for local development
    const baseUrl =
      process.env.SERVER_URL ||
      (reqHost ? `${protocol || 'http'}://${reqHost}` : 'http://localhost:5000');

    const filename = path.basename(file.path);
    const localUrl = `${baseUrl}/uploads/${filename}`;

    return {
      url: localUrl,
      publicId: filename
    };
  }
}

export default StorageService;
