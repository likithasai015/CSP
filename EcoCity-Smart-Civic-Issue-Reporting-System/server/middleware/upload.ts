import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { Request } from 'express';

// In serverless environments (e.g. Vercel / AWS Lambda), the filesystem is read-only
// except for the temporary directory (/tmp). Use os.tmpdir() when deployed.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
export const uploadDir = isServerless
  ? path.join(os.tmpdir(), 'ecocity-uploads')
  : path.resolve(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err: any) {
  console.warn(`[Uploads Directory Warning] Could not create directory ${uploadDir}: ${err.message}`);
}

// Storage configuration with safe sanitized filenames
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeRandom = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    cb(null, `report-${timestamp}-${safeRandom}${ext}`);
  }
});

// File filter restricting to JPEG, PNG, and WebP
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// 5 MB max file size
export const uploadReportPhoto = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter
}).single('photo');

export default uploadReportPhoto;
