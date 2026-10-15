import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import reportRoutes from './routes/reportRoutes';
import authRoutes from './routes/authRoutes';
import errorHandler from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import Admin from './models/Admin';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
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

// 3. Static Files (Uploaded Photos)
app.use('/uploads', express.static(uploadDir));

// 4. API Endpoints
// Mount report routes at standard /api/reports and compatible aliases
app.use('/api/reports', reportRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/complaints', reportRoutes);
app.use('/api/v1/complaints', reportRoutes);
app.use('/api/admin/complaints', reportRoutes);
app.use('/api/v1/admin/complaints', reportRoutes);

// Mount authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 5. 404 Handler for undefined API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// 6. Centralized Error Handling Middleware
app.use(errorHandler);

// Helper to seed initial admin user if configured
async function seedInitialAdmin(): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@ecocity.com';
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin && adminPassword) {
      await Admin.create({
        email: adminEmail,
        name: process.env.ADMIN_NAME || 'EcoCity Administrator',
        password: adminPassword,
        role: 'admin'
      });
      console.log(`[Auth] Initial administrator seeded for: ${adminEmail}`);
    }
  } catch (seedErr: any) {
    console.warn(`[Auth Seed Warning] Could not check or seed admin: ${seedErr.message}`);
  }
}

// Start Server
export async function startServer() {
  try {
    await connectDB();
    await seedInitialAdmin();

    const server = app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`  EcoCity Civic Backend Server Running`);
      console.log(`  Port: http://localhost:${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Reports API:  http://localhost:${PORT}/api/reports`);
      console.log(`  Brevo Email:  ${process.env.BREVO_API_KEY ? 'Configured' : 'Missing BREVO_API_KEY (mock/retry mode)'}`);
      console.log(`==================================================\n`);
    });

    return server;
  } catch (error: any) {
    console.error(`[Server Start Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Auto-start server ONLY when run directly from command line (e.g. `npm run server` or `tsx server/index.ts`)
const isDirectExecution = Boolean(
  process.argv[1] &&
  (process.argv[1].endsWith(path.join('server', 'index.ts')) ||
   process.argv[1].endsWith(path.join('server', 'index.js')) ||
   process.argv[1].endsWith('index.ts') ||
   process.argv[1].endsWith('index.js'))
);

if (isDirectExecution && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
