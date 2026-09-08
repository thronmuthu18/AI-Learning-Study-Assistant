import mongoose from 'mongoose';
import config from './index';

let inMemoryServer: any = null;

export const connectDB = async (customUri?: string): Promise<typeof mongoose> => {
  const uri = customUri || config.mongoUri;
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    // In development mode, if local MongoDB service is not running, provide automatic in-memory fallback
    if (
      config.env !== 'production' &&
      (error.message?.includes('ECONNREFUSED') || error.name === 'MongooseServerSelectionError')
    ) {
      console.warn('\n⚠️  [Database] Local MongoDB server (port 27017) is not currently running.');
      console.log('⚡ [Database] Launching embedded zero-config database for instant development...\n');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        inMemoryServer = await MongoMemoryServer.create();
        const memUri = inMemoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[Database] ✅ Embedded MongoDB active and connected at: ${memUri}`);
        return conn;
      } catch (memErr) {
        console.error('[Database] Failed to start embedded MongoDB:', memErr);
      }
    }

    console.error('[Database] MongoDB connection error:', error);
    if (config.env === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (inMemoryServer) {
      await inMemoryServer.stop();
    }
    console.log('[Database] MongoDB disconnected cleanly');
  } catch (error) {
    console.error('[Database] Disconnect error:', error);
  }
};
