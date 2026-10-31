import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authMiddleware = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return res.status(401).json({ message: "Token not found, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "domdrakdomdom");

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "User not found or account removed. Please login again." });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired. Please login again." });
        }
        return res.status(401).json({ message: "Invalid token. Authorization denied." });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            const currentRole = req.user ? req.user.role : "unauthorized";
            return res.status(403).json({ message: `Role ${currentRole} does not have access to this resource` });
        }
        next();
    };
};
