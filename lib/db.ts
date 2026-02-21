import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "❌ [DB] MONGODB_URI is not defined. Please add it to your .env.local file."
  );
}

/**
 * Cached mongoose connection.
 * In development, Next.js hot-reloads the module on every change, which would
 * create a new connection each time. We cache the connection on the global
 * object to prevent that.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS global type to hold our cache
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};
global._mongooseCache = cached;

/**
 * Establishes a connection to MongoDB via Mongoose.
 * Re-uses an existing connection if one is already open (cache-safe for dev hot-reload).
 */
async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection immediately
  if (cached.conn) {
    return cached.conn;
  }

  // Return in-progress connection promise if already initiated
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI as string, opts)
      .then((mongooseInstance) => {
        console.log("✅ [DB] MongoDB connected successfully.");
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset so the next call retries the connection
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
