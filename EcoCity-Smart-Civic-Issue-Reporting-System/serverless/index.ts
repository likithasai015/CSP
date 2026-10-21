
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index.js';
import { connectDB } from '../server/config/db.js';

let dbConnectionPromise: Promise<void> | null = null;

async function ensureDatabaseConnection(): Promise<void> {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().catch((error) => {
      dbConnectionPromise = null;
      throw error;
    });
  }

  await dbConnectionPromise;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const matchedPath =
    (req.headers['x-matched-path'] as string) ||
    (req.headers['x-vercel-matched-path'] as string);

  if (
    matchedPath &&
    (req.url === '/api' ||
      req.url === '/' ||
      req.url?.startsWith('/api?'))
  ) {
    req.url = matchedPath;
  }

  try {
    await ensureDatabaseConnection();
    return app(req as any, res as any);
  } catch (error) {
    console.error('Vercel API initialization failed:', error);

    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please try again later.',
    });
  }
}
