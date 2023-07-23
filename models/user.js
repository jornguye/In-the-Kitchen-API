import { ObjectId } from 'mongodb';
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    fName: {
        type: String,
        required: true,
    },
    lName: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    bio:{
        type: String,
        default: "N/A"
    },
    image:{
        type: String,
        default: "TempProfilePic.jpeg"
    },
    friends: {
        type: [String],
        default: []
    },
    friendRequests: {
        type: [ObjectId],
        defualt: []
    }
    
    // friends: [String] (not completed. is cursed)
});

export default mongoose.model('User',userSchema);
