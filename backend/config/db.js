import mongoose from "mongoose";
import dns from "node:dns";

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("FATAL: MONGO_URI is not set. Add it to backend/.env.");
  }

  try {
    // Set public DNS servers when using SRV (mongodb+srv://) to prevent Windows querySrv ECONNREFUSED issues
    if (process.env.MONGO_URI.startsWith("mongodb+srv://")) {
      try {
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
      } catch {
        // Continue if dns.setServers is restricted
      }
    }

    // Set connection timeout suitable for cloud / Atlas connections
    const conn = await Promise.race([
      mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 20000,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("MongoDB connection timeout")), 12000)
      )
    ]);

    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    throw err;
  }
};
