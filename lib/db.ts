
import mongoose, { Connection } from "mongoose";

// 1. Define the custom type for the cached Mongoose connection
interface MongooseCache {
  conn: Connection | null;
  promise: Promise<typeof mongoose> | null;
}

// Check for MongoDB URI existence (mandatory)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable.");
}

// 2. Access the global object and assert its type
// Initialize the cache object directly on the global object if it doesn't exist.
const globalWithMongoose = global as typeof global & {
  mongoose?: MongooseCache;
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const cache = globalWithMongoose.mongoose!; // Use non-null assertion after initialization check

  if (cache.conn) {
    console.log("Using cached database connection.");
    return cache.conn;
  }
  
  if (!cache.promise) {
    console.log("Creating new database connection...");
    // Start the connection process and store the promise
    cache.promise = mongoose
      .connect(MONGODB_URI)
      .then((mongooseInstance) => mongooseInstance); // Resolves to the mongoose object
  }
  
  // Wait for the connection promise to resolve
  const mongooseInstance = await cache.promise;

  // Set the connection object on the cache
  cache.conn = mongooseInstance.connection;
  
  console.log("Database connection established.");
  return cache.conn;
}
