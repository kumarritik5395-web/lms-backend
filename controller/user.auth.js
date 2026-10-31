import dotenv from "dotenv";
dotenv.config();

import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateToken = (user) => jwt.sign(
    {
        id: user._id,
        role: user.role
    },
    process.env.JWT_SECRET || "domdrakdomdom",
    { expiresIn: "7d" }
);

export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" });
        }

        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists, kindly login" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role: role || "student"
        });

        return res.status(201).json({
            message: "User registered successfully",
            user,
            token: generateToken(user)
        });
    } catch (error) {
        console.error("Register Error:", error.message);
        return res.status(500).json({ message: error.message || "Registration failed" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        return res.status(200).json({
            user,
            token: generateToken(user)
        });
    } catch (error) {
        console.error("Login Error:", error.message);
        return res.status(500).json({ message: error.message || "Login failed" });
    }
};

export const profile = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Unauthorized. User profile not found." });
        }

        const user = await User.findById(req.user._id)
            .select("-password")
            .populate("issuedBooks.bookId");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error("Profile Error:", error.message);
        return res.status(500).json({ message: error.message || "Failed to fetch profile" });
    }
};

export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id || req.params._id;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error("getUserById Error:", error.message);
        return res.status(500).json({ message: error.message || "Failed to fetch user" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        return res.status(200).json(users);
    } catch (error) {
        console.error("getAllUsers Error:", error.message);
        return res.status(500).json({ message: error.message || "Failed to fetch users" });
    }
};
