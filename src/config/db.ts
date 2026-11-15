import mongoose from 'mongoose';
import { ENV } from './env.js';

/**
 * Builds or normalizes the MongoDB connection URI.
 * Handles placeholders like <db_password> or <username> if provided separately.
 */
export const getMongoURI = (): string => {
  let uri = ENV.MONGODB_URI;

  if (!uri && ENV.MONGODB_USER && ENV.MONGODB_PASSWORD) {
    uri = `mongodb+srv://${encodeURIComponent(ENV.MONGODB_USER)}:${encodeURIComponent(ENV.MONGODB_PASSWORD)}@pulsefit1.whxonav.mongodb.net/pulsefit?retryWrites=true&w=majority`;
  }

  if (uri && ENV.MONGODB_PASSWORD) {
    uri = uri.replace('<db_password>', encodeURIComponent(ENV.MONGODB_PASSWORD))
             .replace('<password>', encodeURIComponent(ENV.MONGODB_PASSWORD));
  }

  if (uri && ENV.MONGODB_USER) {
    uri = uri.replace('<username>', encodeURIComponent(ENV.MONGODB_USER))
             .replace('firola3falcon_db_user', encodeURIComponent(ENV.MONGODB_USER));
  }

  return uri;
};

export const connectDB = async (): Promise<void> => {
  try {
    const primaryUri = getMongoURI();

    if (!primaryUri) {
      throw new Error('Neither MONGODB_URI nor MONGODB_USER/MONGODB_PASSWORD is set.');
    }

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected.');
    });

    try {
      await mongoose.connect(primaryUri);
    } catch (err: any) {
      // Automatic fallback if Windows DNS blocks SRV queries (querySrv ECONNREFUSED)
      if (err?.code === 'ECONNREFUSED' && primaryUri.includes('mongodb+srv://')) {
        console.warn('⚠️ Windows DNS SRV lookup failed (ECONNREFUSED). Falling back to direct replica set nodes...');
        const user = ENV.MONGODB_USER || 'firola3falcon_db_user';
        const pass = ENV.MONGODB_PASSWORD || '1wBQQ3iJxjwGOS6B';
        const fallbackUri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@ac-egsu70k-shard-00-00.whxonav.mongodb.net:27017,ac-egsu70k-shard-00-01.whxonav.mongodb.net:27017,ac-egsu70k-shard-00-02.whxonav.mongodb.net:27017/pulsefit?ssl=true&authSource=admin&replicaSet=atlas-elthkp-shard-0&retryWrites=true&w=majority`;
        await mongoose.connect(fallbackUri);
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};
