import mongoose, { Connection } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your environment variables");
}

// 1. Define the custom type for the global cache object
interface MongooseCache {
  conn: Connection | null;
  promise: Promise<typeof mongoose> | null;
}

// 2. Extend the global object to include our cached property
// We assert it as MongooseCache, initializing it if it doesn't exist.
// This is the key fix for the "Unexpected any" errors.
let cached = global as typeof global & {
  mongoose: MongooseCache;
};

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.mongoose.conn) {
    console.log("Using cached database connection.");
    return cached.mongoose.conn;
  }
  
  if (!cached.mongoose.promise) {
    console.log("Creating new database connection...");
    cached.mongoose.promise = mongoose
      .connect(MONGODB_URI as string)
      .then((mongooseInstance) => mongooseInstance);
  }
  
  // Wait for the connection promise to resolve
  const mongooseInstance = await cached.mongoose.promise;
  cached.mongoose.conn = mongooseInstance.connection;
  
  console.log("Database connection established.");
  return cached.mongoose.conn;
}
