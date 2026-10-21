
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing from the .env file');
  }

  await mongoose.connect(uri);

  console.log('✅ MongoDB Connected Successfully!');
  console.log(`Database: ${mongoose.connection.name}`);
};

export default connectDB;
export { connectDB };
