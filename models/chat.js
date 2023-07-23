import { ObjectId } from 'mongodb';
import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
    room_id:{
        type:String,
        unique:true
    },
    users:[String],  // this would be for example ["royce","nick"] for the two users in the DB
    messages:{
        type: [{body:String, user:String, time:String}]
    }
})

export default mongoose.model('Chat',chatSchema);