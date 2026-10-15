import mongoose from 'mongoose';

/**
 * Global cache interface for Mongoose in serverless environments.
 * Prevents opening multiple database connections across warm serverless invocations.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectDB = async (): Promise<typeof mongoose | null> => {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const defaultLocalURI = isServerless ? '' : 'mongodb://127.0.0.1:27017/ecocity';
  const mongoURI = process.env.MONGODB_URI?.trim() || defaultLocalURI;

  if (!mongoURI) {
    console.warn('[Database] MONGODB_URI is not set in environment variables.');
    return null;
  }

  // 1. If connection is already established, reuse cached connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // 2. If connection is already in progress, await the existing promise
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(mongoURI, opts).then((m) => {
      console.log(`[Database] MongoDB connected successfully: ${m.connection.host}/${m.connection.name}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error: any) {
    cached.promise = null;
    cached.conn = null;
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
