
import mongoose, { Connection } from "mongoose";

// 1. Define the custom type for the cached Mongoose connection
interface MongooseCache {
  conn: Connection | null;
  promise: Promise<typeof mongoose> | null;
}

// Check for MongoDB URI existence (mandatory)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // We throw an Error if it's missing, guaranteeing it's a string below this point.
  throw new Error("Please define the MONGODB_URI environment variable.");
}

// 2. Access the global object and assert its type
const globalWithMongoose = global as typeof global & {
  mongoose?: MongooseCache;
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const cache = globalWithMongoose.mongoose!;

  if (cache.conn) {
    console.log("Using cached database connection.");
    return cache.conn;
  }
  
  if (!cache.promise) {
    console.log("Creating new database connection...");
    // FIX: Use non-null assertion operator (!) on MONGODB_URI to guarantee the type checker
    // that the value is a string, since we checked for it above.
    cache.promise = mongoose
      .connect(MONGODB_URI!) 
      .then((mongooseInstance) => mongooseInstance);
  }
  
  const mongooseInstance = await cache.promise;
  cache.conn = mongooseInstance.connection;
  
  console.log("Database connection established.");
  return cache.conn;
}
