
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index';
import { connectDB } from '../server/config/db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    await connectDB();
  } catch (error) {
    console.error('[Serverless Handler] Database connection failed:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed'
    });
  }

  return app(req as any, res as any);
}
