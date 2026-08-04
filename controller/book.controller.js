import Book from "../models/book.model.js"
import User from "../models/user.model.js";

export const getBookById = async(req, res) =>{
    try{
        const book = await Book.findById(req.params.id)
        if(!book) return res.status(403).json({message:"Book not found"});
        return res.status(200).json({book});
    } catch(error){
        return res.status(500).json({Error:error.message})   
    }
}

export const getAllBooks = async(req,res) =>{
    try{
        const books = await Book.find();
        return res.status(200).json({books});
    } catch(error){
        return res.status(500).json({Error:error.message})
    }
}

export const createBook = async(req,res) =>{
    try{
        const {name,version,copies} = req.body;
        let book =await Book.findOne({name});
        if(!book){
            book = await Book.create({name,version:Number(version),copies});
            return res.status(201).json({book});
        }
        else{
            if(Number(version)>book.version){
                book.version = Number(version);
                book.copies = copies;
                await book.save();
                return res.status(200).json({ message: "Book updated to new version", book });
              
            }else if(Number(version)===book.version){
                book.copies = Number(book.copies +copies);
                await book.save();
                return res.status(200).json({book})
            }else{
                return res.status(400).json({message:"Already updated version of this book is available"})
            }
        }
    } catch(error){
        return res.status(500).json({Error:error.message})
    }
}

export const deleteBook = async(req,res) =>{
    try{
        const book = await Book.findByIdAndDelete(req.params.id);
        return res.status(200).json({message:"Book deleted",book })
    } catch(error){
        return res.status(500).json({Error:error.message})
    }
}

export const issuedBooks = async(req,res) =>{
    try{
        const {userId , bookId} = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        let book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        if (book.copies <= 0) {
            return res.status(400).json({
                message: "Book copy is not available"
            });
        }

        book.copies = book.copies - 1;

        user.issuedBooks.push({ bookId });

        await user.save();
        await book.save();

        return res.status(200).json({
            user,
            book
        });
    } catch (error){
        return res.status(500).json({message:`Error:${error.message}`})
    }
}

export const returnBooks = async(req,res) =>{
    try{
        const {bookId , userId} = req.body;
        const user = await User.findById(userId);
        if(!user) return res.status(402).json({message:"User not found"});

        let book = await Book.findById(bookId);
        if(!book) return res.status(404).json({message: "Book not found"});

        const isBookAvailable = user.issuedBooks.findIndex(b=>b.bookId.toString()===bookId.toString());
        if(isBookAvailable === -1){
             return res.status(401).json({message:"Book is not issued to user"})
        };

        user.issuedBooks.splice(isBookAvailable, 1);

        book.copies = book.copies+1;

        await user.save();
        await book.save();

        return res.status(200).json({user,book});

    } catch(error) {
        return res.status(500).json({message:`Error:${error.message}`})
    }
}

