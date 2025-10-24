
import mongoose, { Connection } from "mongoose";

// 1. Define the custom type for the cached Mongoose connection
interface MongooseCache {
  conn: Connection | null;
  // Mongoose.connect returns the Mongoose object itself (default export), 
  // so we type the promise to resolve to 'typeof mongoose'.
  promise: Promise<typeof mongoose> | null;
}

// Check for MongoDB URI existence (mandatory)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Use a standard Error for deployment failure detection
  throw new Error("Please define the MONGODB_URI environment variable.");
}

// 2. Use a globally declared `const` variable structure to satisfy Next.js/ESLint's
// strict `prefer-const` rule. We assert the type onto the global object.
const cached = global as typeof global & {
  mongoose?: MongooseCache; // Use optional chaining for initial check
};

// 3. Initialize the cache object if it doesn't exist
if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // Use the local cache object, which is now strongly typed
  const cache = cached.mongoose; 

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
