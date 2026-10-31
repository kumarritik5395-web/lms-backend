import dotenv from "dotenv";
dotenv.config();
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import authRoutes from "./routes/user.routes.js";
import bookRoutes from "./routes/book.routes.js";
import cors from "cors";

import express from "express";
import mongoose from "mongoose";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({ status: "ok", message: "LMS Backend API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

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