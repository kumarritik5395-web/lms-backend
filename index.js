import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly from the backend directory
dotenv.config({ path: path.join(__dirname, ".env") });

// Use public DNS for external MongoDB Atlas SRV lookups if needed
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import authRoutes from "./routes/user.routes.js";
import bookRoutes from "./routes/book.routes.js";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// Base & Health check endpoints (always accessible)
app.get("/api", (req, res) => {
  res.json({ status: "ok", message: "LMS Backend API is running" });
});

app.get("/api/health", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isConnected ? "ok" : "degraded",
    database: isConnected ? "connected" : "disconnected",
  });
});

// Database readiness check middleware:
// Prevents requests from buffering for 10000ms if DB is not connected
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "Database connection is not ready. Please ensure MongoDB is running and MONGO_URI in .env is correct."
    });
  }
  next();
});

// Application routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err.message);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    message: err.message || "An unexpected internal server error occurred"
  });
});

const LOCAL_MONGO = "mongodb://127.0.0.1:27017/library";
const primaryMongoUri = process.env.MONGO_URI || LOCAL_MONGO;

const connectWithFallback = async () => {
  try {
    console.log(`Connecting to MongoDB (${primaryMongoUri.includes("127.0.0.1") ? "Local" : "Remote"})...`);
    await mongoose.connect(primaryMongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB connected successfully!");
    return true;
  } catch (err) {
    console.warn("Primary MongoDB connection failed:", err.message);
    if (primaryMongoUri !== LOCAL_MONGO) {
      console.log("Attempting fallback to local MongoDB (127.0.0.1:27017)...");
      try {
        await mongoose.connect(LOCAL_MONGO, { serverSelectionTimeoutMS: 5000 });
        console.log("Fallback to local MongoDB connected successfully!");
        return true;
      } catch (localErr) {
        console.error("Local MongoDB fallback also failed:", localErr.message);
      }
    }
    return false;
  }
};

const startServer = async () => {
  await connectWithFallback();

  app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
  });
};

startServer();
