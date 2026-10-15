
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index.js';
import { connectDB } from '../server/config/db.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const requestPath = new URL(req.url || '/', 'http://localhost').pathname;
  const isHealthCheck = ['/api/health', '/api/v1/health', '/health'].includes(requestPath);

  if (!isHealthCheck) {
    try {
      await connectDB();
    } catch (error) {
      console.error('[Serverless Handler] Database connection failed:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed'
      });
    }
  }

  return app(req as any, res as any);
}
