
import "dotenv/config";
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import mongoose from 'mongoose';

import connectDB from './config/db.js';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import adminAuthRouter from './adminAuth.js';
import mockDataService from './services/mockDataService.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// Handle requests in serverless environments
app.use((req: any, _res: any, next: any) => {
  if (!req.socket) {
    req.socket = { remoteAddress: '127.0.0.1' };
  } else if (!req.socket.remoteAddress) {
    req.socket.remoteAddress = '127.0.0.1';
  }
  next();
});

// Upload directory
const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);

const uploadDir = isServerless
  ? path.join(os.tmpdir(), 'ecocity-uploads')
  : path.resolve(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (error) {
  console.error('[Uploads] Could not create upload directory:', error);
}

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      try {
        const originUrl = new URL(origin);
        if (originUrl.hostname.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch {
        // Invalid origin
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Admin-Key',
      'Accept'
    ]
  })
);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', apiLimiter);
app.use('/api/admin', adminAuthRouter);

// Uploaded photos
app.use(['/uploads', '/api/uploads'], express.static(uploadDir));

app.get(
  ['/uploads/:filename', '/api/uploads/:filename'],
  (req: Request, res: Response) => {
    const filename = path.basename(req.params.filename || '');

    const candidateDirs = [
      uploadDir,
      path.resolve(process.cwd(), 'uploads'),
      path.resolve(
        process.cwd(),
        'EcoCity-Smart-Civic-Issue-Reporting-System',
        'uploads'
      )
    ];

    for (const dir of candidateDirs) {
      const fullPath = path.join(dir, filename);

      if (fs.existsSync(fullPath)) {
        try {
          if (fs.statSync(fullPath).size > 100) {
            return res.sendFile(fullPath);
          }
        } catch {
          // Continue checking directories
        }
      }
    }

    return res.redirect(
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800'
    );
  }
);

// Health check: report actual Mongoose connection state
const healthHandler = (_req: Request, res: Response) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? 'healthy' : 'unavailable',
    database: connected ? 'MongoDB connected' : 'MongoDB disconnected',
    databaseName: connected ? mongoose.connection.name : null,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment:
      process.env.NODE_ENV || (isServerless ? 'production' : 'development')
  });
};

app.get(['/api/health', '/api/v1/health', '/health'], healthHandler);

app.get(['/', '/api'], (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'EcoCity Smart Civic Issue Reporting System API',
    status: 'online',
    version: '1.0.0',
    mode: 'MongoDB',
    endpoints: {
      health: '/api/health',
      reports: '/api/reports',
      auth: '/api/auth'
    }
  });
});

// Fallback for POST requests
app.post(['/', '/api'], (req: Request, res: Response, next: NextFunction) => {
  reportRoutes(req, res, next);
});

// Report routes
app.use('/api/reports', reportRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/reports', reportRoutes);
app.use('/v1/reports', reportRoutes);

app.use('/api/complaints', reportRoutes);
app.use('/api/v1/complaints', reportRoutes);
app.use('/complaints', reportRoutes);
app.use('/v1/complaints', reportRoutes);

app.use('/api/admin/complaints', reportRoutes);
app.use('/api/v1/admin/complaints', reportRoutes);
app.use('/admin/complaints', reportRoutes);
app.use('/v1/admin/complaints', reportRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/v1/auth', authRoutes);

// 404 handler
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use(errorHandler);

// Start server only after MongoDB connects
export async function startServer() {
  try {
    await connectDB();

    const adminConfig = mockDataService.getAdminConfig();

    const server = app.listen(PORT, () => {
      console.log('\n==============================================');
      console.log(' EcoCity Smart Civic Issue Reporting Backend');
      console.log(' Mode: MongoDB');
      console.log(` Database: ${mongoose.connection.name}`);
      console.log(` Port: http://localhost:${PORT}`);
      console.log(` Health: http://localhost:${PORT}/api/health`);
      console.log(` Reports: http://localhost:${PORT}/api/reports`);
      console.log(` Admin Email: ${adminConfig.email}`);
      console.log(
        ` Brevo Email: ${
          process.env.BREVO_API_KEY ? 'Configured' : 'Missing BREVO_API_KEY'
        }`
      );
      console.log('==============================================\n');
    });

    return server;
  } catch (error: any) {
    console.error(
      '[Server Start Error] MongoDB connection failed:',
      error.message
    );
    process.exit(1);
  }
}

// Auto-start for direct local execution.
// Serverless deployments need their own initialization strategy.
const isDirectExecution = Boolean(
  process.argv[1] &&
    (
      process.argv[1].endsWith(path.join('server', 'index.ts')) ||
      process.argv[1].endsWith(path.join('server', 'index.js')) ||
      process.argv[1].endsWith('index.ts') ||
      process.argv[1].endsWith('index.js')
    )
);

if (
  isDirectExecution &&
  process.env.NODE_ENV !== 'test' &&
  !isServerless
) {
  startServer();
}

export default app;
