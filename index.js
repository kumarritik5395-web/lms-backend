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

// Base & Health check endpoints
app.get("/api", (req, res) => {
  res.json({ status: "ok", message: "LMS Backend API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Application routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

// Global Error Handler to always return clean JSON error messages
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err.message);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    message: err.message || "An unexpected internal server error occurred"
  });
});

const LOCAL_MONGO = "mongodb://127.0.0.1:27017/library";
const mongoUri = process.env.MONGO_URI || LOCAL_MONGO;

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB connected successfully:", mongoUri.includes("127.0.0.1") ? "Local MongoDB" : "Remote MongoDB");
  } catch (err) {
    console.warn("Primary MongoDB connection failed:", err.message);
    if (mongoUri !== LOCAL_MONGO) {
      console.log("Attempting fallback to local MongoDB (127.0.0.1:27017)...");
      try {
        await mongoose.connect(LOCAL_MONGO, { serverSelectionTimeoutMS: 5000 });
        console.log("Local MongoDB connected successfully!");
      } catch (localErr) {
        console.error("Local MongoDB also failed:", localErr.message);
      }
    }
  }

  app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
  });
};

startServer();
