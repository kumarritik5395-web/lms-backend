import dotenv from "dotenv";
dotenv.config();

import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateToken = (user) =>jwt.sign({
    id:user._id,
    role:user.role
},process.env.JWT_SECRET,{expiresIn:"15m"})

export const register = async(req , res)=>{
    const{name,email,password,role}=req.body;

    if(!name||!email||!password){
        return res.status(400).json({message:"name , email and password required"})
    }
    let user = await User.findOne({email});
    if(user){
        return res.status(400).json({message:"Email already exist ,kindly login"})
   }
   const hashedPassword = await bcrypt.hash(password,10);
   user = await User.create({name,email,password:hashedPassword,role})
     return res.status(201).json({user})

}

export const login = async(req,res) =>{
    const{email,password,} = req.body;
    let user = await User.findOne({email});
    if(!user){
        return res.status(400).json({message:"User not found"});
    }
    const match = await bcrypt.compare(password,user.password);
    if(!match){
        return res.status(400).json({message:"Invalid username or password"})
    }
    return res.status(200).json({user,token:generateToken(user)})
}
export const profile = async(req,res)=>{
    try {

        const user = await User.findById(req.user._id).populate("issuedBooks.bookId");
        console.log(user);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }

}
export const getUserById = async(req,res) =>{
    const user = await User.findById(req.params._id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
}

export const getAllUsers = async(req,res) =>{
    const result = await User.find();
    return res.status(200).json(result);
}