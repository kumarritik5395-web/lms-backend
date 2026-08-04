import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authMiddleware = async(req,res,next)=>{
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token =req.headers.authorization.split(" ")[1];
    }
    if(!token){
        return res.status(401).json({message:"Token not found"})
    };

    try{
      const decoded = jwt.verify(token,process.env.JWT_SECRET);


      const user = await User.findById(decoded.id)
      req.user = user;
      next()
} catch(error){
    return res.status(500).json({message:"Invalid token"})
 }
}
export const authorize = (...roles) =>{
    return (req,res,next) =>{
        if(!roles.includes(req.user.role)){
            return res.status(403).json({message:`Role ${req.user.role} do not have access`})
        }
        next()
    }
}


