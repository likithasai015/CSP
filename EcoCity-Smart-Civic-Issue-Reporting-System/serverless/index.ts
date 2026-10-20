import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Normalize req.url in Vercel Serverless environment:
  // When Vercel rewrites /api/(.*) to /api, headers['x-matched-path'] or ['x-vercel-matched-path'] contains the original route
  const matchedPath =
    (req.headers['x-matched-path'] as string) ||
    (req.headers['x-vercel-matched-path'] as string);

  if (matchedPath && (req.url === '/api' || req.url === '/' || req.url?.startsWith('/api?'))) {
    req.url = matchedPath;
  }

  return app(req as any, res as any);
}
