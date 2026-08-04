import express from "express";
import {authMiddleware,authorize} from "../middleware/auth.middleware.js";
import { createBook, deleteBook, getAllBooks,getBookById, issuedBooks, returnBooks} from "../controller/book.controller.js";

const router = express.Router();

router.get("/:id",authMiddleware,getBookById);
router.get("/",authMiddleware,getAllBooks);
router.post("/",authMiddleware,authorize("admin"),createBook);
router.delete("/:id",authMiddleware,authorize("admin"),deleteBook);
router.post("/issue",authMiddleware,issuedBooks);
router.post("/return",authMiddleware,returnBooks);
export default router;