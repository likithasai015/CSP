import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error Handler]', err);

  // Multer file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'File size exceeds maximum allowed limit of 5 MB'
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
    return;
  }

  // Multer fileFilter custom error
  if (err.message && err.message.includes('Only JPEG, PNG, and WebP images are allowed')) {
    res.status(400).json({
      success: false,
      message: err.message
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
    return;
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(404).json({
      success: false,
      message: 'Resource not found with the specified ID'
    });
    return;
  }

  // General server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

export default errorHandler;
