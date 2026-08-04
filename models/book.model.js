import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
    },
    description:{
        type:String,
        default:""
    },
    author:{
        type:String,
        default:"unkrown"
    },
    copies:{
        type:Number,
        default:1
    },
    version:{
        type:Number,
        default:1
    }

},{timestamps:true});

const Book = mongoose.model("Book", bookSchema);

export default Book