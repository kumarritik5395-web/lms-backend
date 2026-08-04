import dotenv from "dotenv";
dotenv.config();
import authRoutes from "./routes/user.routes.js";
import bookRoutes from "./routes/book.routes.js";
import cors from "cors";

import express from "express";
import mongoose from "mongoose";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes)
app.use("/api/books", bookRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("MongoDB connected");
    app.listen(3000,()=>{
        console.log("Server is running at port 3000");

    })
})
.catch(err=>console.log("Error:",err.message));