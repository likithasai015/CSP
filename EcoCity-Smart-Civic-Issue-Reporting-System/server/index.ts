import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import adminAuthRouter from './adminAuth.js';
import mockDataService from './services/mockDataService.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Enable reverse proxy trust for Vercel / Cloudflare / AWS Lambda
app.set('trust proxy', 1);

// Ensure req.socket and remoteAddress exist in serverless environments
app.use((req: any, _res: any, next: any) => {
  if (!req.socket) {
    req.socket = { remoteAddress: '127.0.0.1' };
  } else if (!req.socket.remoteAddress) {
    req.socket.remoteAddress = '127.0.0.1';
  }
  next();
});

// Determine safe upload directory based on runtime environment (local vs. Vercel serverless)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadDir = isServerless
  ? path.join(os.tmpdir(), 'ecocity-uploads')
  : path.resolve(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch {
  // Ignored in read-only environments
}

// 1. CORS Configuration
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
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check configured origins and local development
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      // Automatically allow Vercel deployment domains (*.vercel.app)
      try {
        const originUrl = new URL(origin);
        if (originUrl.hostname.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch {
        // invalid origin url, fallback to standard check
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key', 'Accept']
  })
);

// 2. Global Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general API rate limiter to all /api routes
app.use('/api', apiLimiter);
app.use("/api/admin", adminAuthRouter);

// 3. Static Files (Uploaded Photos - active for local development)
app.use('/uploads', express.static(uploadDir));

// 4. Root & Health Check Endpoints
const healthHandler = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'database-free (centralized in-memory mock-data service)',
    environment: process.env.NODE_ENV || (isServerless ? 'production' : 'development')
  });
};

app.get(['/api/health', '/api/v1/health', '/health'], healthHandler);

app.get(['/', '/api'], (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'EcoCity Smart Civic Issue Reporting System API',
    status: 'online',
    version: '1.0.0',
    mode: 'database-free (in-memory mock data, resets on restart)',
    endpoints: {
      health: '/api/health',
      reports: '/api/reports',
      auth: '/api/auth'
    }
  });
});

// 5. API Endpoints
// Mount report routes across all standard prefixes to prevent path-mismatch 404s
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

// Mount authentication routes across all prefixes
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/v1/auth', authRoutes);

// 6. 404 Handler for undefined API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// 7. Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server for local execution
export async function startServer() {
  try {
    const adminConfig = mockDataService.getAdminConfig();

    const server = app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`  EcoCity Smart Civic Issue Reporting Backend`);
      console.log(`  Mode: Database-Free (Centralized In-Memory Store)`);
      console.log(`  Port: http://localhost:${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Reports API:  http://localhost:${PORT}/api/reports`);
      console.log(`  Admin Email:  ${adminConfig.email}`);
      console.log(`  Brevo Email:  ${process.env.BREVO_API_KEY ? 'Configured' : 'Missing BREVO_API_KEY'}`);
      console.log(`  Note: In-memory mock data resets when backend restarts.`);
      console.log(`==================================================\n`);
    });

    return server;
  } catch (error: any) {
    console.error(`[Server Start Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Auto-start server ONLY when run directly from command line (e.g. `npm run server`)
// Do NOT call app.listen() when executed in a serverless environment (Vercel)
const isDirectExecution = Boolean(
  process.argv[1] &&
  (process.argv[1].endsWith(path.join('server', 'index.ts')) ||
   process.argv[1].endsWith(path.join('server', 'index.js')) ||
   process.argv[1].endsWith('index.ts') ||
   process.argv[1].endsWith('index.js'))
);

if (isDirectExecution && process.env.NODE_ENV !== 'test' && !isServerless) {
  startServer();
}

export default app;
