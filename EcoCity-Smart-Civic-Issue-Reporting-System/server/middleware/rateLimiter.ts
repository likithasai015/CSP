import rateLimit from 'express-rate-limit';

/**
 * Safely extracts client IP address across standard servers and
 * serverless environments (Vercel / AWS Lambda / reverse proxies).
 */
export const getClientIp = (req: any): string => {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.headers?.['x-real-ip'] || req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

// Rate limiting for public garbage complaint submissions
export const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 submissions per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: {
    success: false,
    message: 'Too many reports submitted from this IP address. Please wait 15 minutes before submitting again.'
  }
});

// Rate limiting for admin authentication to prevent brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  validate: { xForwardedForHeader: false, trustProxy: false }
});

export default { submissionLimiter, authLimiter, apiLimiter, getClientIp };
