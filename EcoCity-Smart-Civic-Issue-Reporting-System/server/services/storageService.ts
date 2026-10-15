import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

export interface StorageUploadResult {
  url: string;
  publicId: string;
}

export class StorageService {
  private static isCloudinaryConfigured(): boolean {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    return !!(
      cloudName &&
      apiKey &&
      apiSecret &&
      cloudName !== 'your_cloud_name' &&
      apiKey !== 'your_api_key'
    );
  }

  /**
   * Upload an image file to Cloudinary if configured; otherwise serve from local /uploads directory.
   */
  public static async processUploadedFile(
    file: Express.Multer.File,
    reqHost?: string,
    protocol?: string
  ): Promise<StorageUploadResult> {
    if (this.isCloudinaryConfigured()) {
      try {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        });

        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'ecocity/complaints',
          resource_type: 'image'
        });

        // Optionally remove temporary local file after uploading to Cloudinary
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (cleanupErr) {
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

    // Local file fallback
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
