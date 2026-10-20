import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  return app(req as any, res as any);
}
