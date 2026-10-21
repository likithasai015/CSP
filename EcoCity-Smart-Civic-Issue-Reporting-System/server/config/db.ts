
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI environment variable is missing');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log('MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('MongoDB connection failed:', {
        name: error.name,
        message: error.message,
      });
    } else {
      console.error('MongoDB connection failed with an unknown error');
    }

    throw error;
  }
};

export default connectDB;
export { connectDB };
