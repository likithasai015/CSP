/**
 * EcoCity Database Configuration
 * Database-free mode: MongoDB is not required.
 * System operates on a centralized in-memory mock-data service.
 */

export const connectDB = async (): Promise<null> => {
  console.log('[Database] Database-free mode active: Operating with centralized in-memory mock data (no MongoDB connection required).');
  return null;
};

export default connectDB;
