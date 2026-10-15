import type { Request, Response } from 'express';
import app from '../server/index';
import { connectDB } from '../server/config/db';

/**
 * Vercel Serverless Function entry point.
 * This function handles incoming requests to /api and /api/* on Vercel.
 * It ensures the database connection is established (or reused from cache)
 * before passing the request to the Express application.
 */
export default async function handler(req: Request, res: Response) {
  try {
    await connectDB();
  } catch (error: any) {
    console.error('[Serverless Handler] Database initialization warning:', error.message);
    // Allow request to proceed so non-DB routes like /api/health remain operational
  }

  return app(req, res);
}
