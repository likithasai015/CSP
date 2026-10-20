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
   * Process uploaded photo:
   * 1. If Cloudinary is configured, uploads to Cloudinary CDN.
   * 2. Otherwise converts the uploaded file into a persistent, self-contained Data URI.
   *    This guarantees that photos render instantly, never 404 on Vercel's ephemeral
   *    filesystem, and are durable within the in-memory mock store.
   */
  public static async processUploadedFile(
    file: Express.Multer.File,
    _reqHost?: string,
    _protocol?: string
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
        console.warn(`[Storage] Cloudinary upload failed (${err.message}). Falling back to self-contained Data URI.`);
      }
    }

    // 2. Persistent, self-contained Data URI
    try {
      if (file.path && fs.existsSync(file.path)) {
        const fileBuffer = fs.readFileSync(file.path);
        const mimeType = file.mimetype || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

        if (isServerless) {
          try {
            fs.unlinkSync(file.path);
          } catch {
            // Ignore cleanup error
          }
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

    // 3. Fallback to relative URL
    const filename = path.basename(file.path);
    return {
      url: `/uploads/${filename}`,
      publicId: filename
    };
  }
}

export default StorageService;
