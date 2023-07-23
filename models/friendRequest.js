import { ObjectId } from 'mongodb';
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 0 // 0 in progress, 1 accepted, 2 rejected
    }
});

export default mongoose.model('FriendRequests',userSchema);
