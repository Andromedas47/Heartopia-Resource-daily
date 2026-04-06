import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('❌ MONGODB_URI is not defined in .env');
  }

  await mongoose.connect(uri, {
    dbName: 'heartopia',
  });

  isConnected = true;
  console.log('✅ Connected to MongoDB Atlas (heartopia)');
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('🔌 Disconnected from MongoDB');
}
