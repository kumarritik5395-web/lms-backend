import Book from "../models/book.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

export const getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid book ID" });
        }

        const book = await Book.findById(id);
        if (!book) return res.status(404).json({ message: "Book not found" });

        return res.status(200).json({ book });
    } catch (error) {
        console.error("getBookById Error:", error.message);
        return res.status(500).json({ message: error.message || "Failed to fetch book" });
    }
};

export const getAllBooks = async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        return res.status(200).json({ books });
    } catch (error) {
        console.error("getAllBooks Error:", error.message);
        return res.status(500).json({ message: error.message || "Failed to fetch books" });
    }
};

export const createBook = async (req, res) => {
    try {
        const { name, version, copies, author, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Book name is required" });
        }

        const numVersion = Number(version) || 1;
        const numCopies = Number(copies) || 1;

        let book = await Book.findOne({ name: name.trim() });
        if (!book) {
            book = await Book.create({
                name: name.trim(),
                version: numVersion,
                copies: numCopies,
                author: author || "Unknown",
                description: description || ""
            });
            return res.status(201).json({ book });
        } else {
            if (numVersion > book.version) {
                book.version = numVersion;
                book.copies = numCopies;
                if (author) book.author = author;
                if (description) book.description = description;
                await book.save();
                return res.status(200).json({ message: "Book updated to new version", book });
            } else if (numVersion === book.version) {
                book.copies = Number(book.copies) + numCopies;
                if (author) book.author = author;
                if (description) book.description = description;
                await book.save();
                return res.status(200).json({ book });
            } else {
                return res.status(400).json({ message: "An updated version of this book already exists" });
            }
        }
    } catch (error) {
        console.error("createBook Error:", error.message);
        return res.status(500).json({ message: error.message || "Failed to create or update book" });
    }
};

export const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid book ID" });
        }

        const book = await Book.findByIdAndDelete(id);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        return res.status(200).json({ message: "Book deleted successfully", book });
    } catch (error) {
        console.error("deleteBook Error:", error.message);
        return res.status(500).json({ message: error.message || "Failed to delete book" });
    }
};

export const issuedBooks = async (req, res) => {
    try {
        const { userId, bookId } = req.body;
        const effectiveUserId = userId || req.user?._id;

        if (!effectiveUserId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        if (!bookId) {
            return res.status(400).json({ message: "Book ID is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(effectiveUserId) || !mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: "Invalid user or book ID format" });
        }

        const user = await User.findById(effectiveUserId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        if (book.copies <= 0) {
            return res.status(400).json({ message: "No copies of this book are currently available" });
        }

        const alreadyIssued = user.issuedBooks && user.issuedBooks.some(
            b => b.bookId && b.bookId.toString() === bookId.toString()
        );
        if (alreadyIssued) {
            return res.status(400).json({ message: "You have already issued this book" });
        }

        book.copies = book.copies - 1;
        user.issuedBooks.push({ bookId });

        await user.save();
        await book.save();

        return res.status(200).json({
            message: "Book issued successfully",
            user,
            book
        });
    } catch (error) {
        console.error("issuedBooks Error:", error.message);
        return res.status(500).json({ message: error.message || "Failed to issue book" });
    }
};

export const returnBooks = async (req, res) => {
    try {
        const { bookId, userId } = req.body;
        const effectiveUserId = userId || req.user?._id;

        if (!effectiveUserId || !bookId) {
            return res.status(400).json({ message: "User ID and Book ID are required" });
        }

        if (!mongoose.Types.ObjectId.isValid(effectiveUserId) || !mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: "Invalid user or book ID format" });
        }

        const user = await User.findById(effectiveUserId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: "Book not found" });

        const bookIndex = user.issuedBooks.findIndex(
            b => b.bookId && b.bookId.toString() === bookId.toString()
        );
        if (bookIndex === -1) {
            return res.status(400).json({ message: "This book is not issued to the user" });
        }

        user.issuedBooks.splice(bookIndex, 1);
        book.copies = book.copies + 1;

        await user.save();
        await book.save();

        return res.status(200).json({
            message: "Book returned successfully",
            user,
            book
        });
    } catch (error) {
        console.error("returnBooks Error:", error.message);
        return res.status(500).json({ message: error.message || "Failed to return book" });
    }
};
