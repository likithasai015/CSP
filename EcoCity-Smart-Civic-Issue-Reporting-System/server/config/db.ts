import mongoose from 'mongoose';

export const connectDB = async (): Promise<typeof mongoose> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecocity';
  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    throw error;
  }
};
