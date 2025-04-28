import { MongoClient, type Db } from "mongodb"

// Parse MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/campaign-manager"
const MONGODB_DB = process.env.MONGODB_DB || "campaign-manager"

// Connection options
const options = {
  minPoolSize: 5, // maintain at least 5 connections
  maxPoolSize: 50, // allow up to 50 connections
  maxIdleTimeMS: 30000, // close connections after 30 seconds of inactivity
  connectTimeoutMS: 10000, // timeout after 10 seconds
  serverSelectionTimeoutMS: 10000, // timeout server selection after 10 seconds
}

// Global variables to cache the MongoDB client and database connections
let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

// Function to handle MongoDB connection errors
function handleConnectionError(error: any) {
  console.error("MongoDB connection error:", error)

  // For development, print detailed error (but hide credentials)
  console.error("Connection details:", {
    uri: MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, "mongodb$1://***:***@"),
    database: MONGODB_DB,
  })
}

/**
 * Connect to MongoDB and return the client and database instances
 */
export async function connectToDatabase() {
  // If we have cached values, use them to prevent multiple connections
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  // Create a new MongoDB client if not cached
  if (!cachedClient) {
    try {
      const client = new MongoClient(MONGODB_URI, options)
      cachedClient = await client.connect()
      console.log("Connected to MongoDB Atlas")
    } catch (error) {
      handleConnectionError(error)
      throw new Error("Failed to connect to MongoDB Atlas")
    }
  }

  // Get reference to the database
  if (!cachedDb) {
    try {
      cachedDb = cachedClient.db(MONGODB_DB)

      // Optional: Run simple query to test connection
      await cachedDb.command({ ping: 1 })
      console.log("Database connection confirmed")
    } catch (error) {
      handleConnectionError(error)
      throw new Error("Failed to connect to database")
    }
  }

  return { client: cachedClient, db: cachedDb }
}

/**
 * Gracefully close the MongoDB connection
 */
export async function closeMongoDBConnection() {
  if (cachedClient) {
    try {
      await cachedClient.close()
      cachedClient = null
      cachedDb = null
      console.log("MongoDB connection closed")
    } catch (error) {
      console.error("Error closing MongoDB connection:", error)
    }
  }
}

// Handle process termination and cleanup
if (typeof process !== "undefined") {
  // Gracefully handle process termination
  ;["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, async () => {
      await closeMongoDBConnection()
      process.exit(0)
    })
  })
}
