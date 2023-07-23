import express from "express";
import User from "../models/user.js";
import FriendRequests from "../models/friendRequest.js";

const router = express.Router();

router.put("/accept/:id", async (req,res) => {
    const reqId = req.params.id;
    const request = await FriendRequests.findOne({_id: reqId});

    if (!request) res.status(404).send({message:"Unable to complete request"});

    const receiverUsername = request.receiver;
    const senderUsername = request.sender;

    const receiverUser = await User.findOne({username: receiverUsername});
    const senderUser = await User.findOne({username: senderUsername});

    if (!receiverUser || !senderUser) res.status(400).send({message:"Unable to complete request"});

    receiverUser.friends = [...receiverUser.friends, senderUsername]
    senderUser.friends = [...senderUser.friends, receiverUsername]

    await receiverUser.save();
    await senderUser.save();

    await FriendRequests.deleteOne({_id:reqId});

    res.status(200).send({message:"Friend Added!"});

});

router.put("/decline/:id", async (req,res) => {
    const reqId = req.params.id;

    const request = await FriendRequests.findOne({_id: reqId});

    if (!request) res.status(404).send({message:"Unable to complete request"});

    await FriendRequests.deleteOne({_id:reqId});

    res.sendStatus(200);    
});

router.put("/cancel/:id", async (req,res) => {
    const reqId = req.params.id;

    const request = await FriendRequests.findOne({_id: reqId});

    if (!request) res.status(404).send({message:"Unable to complete request"});

    await FriendRequests.deleteOne({_id:reqId});

    res.sendStatus(200);    
});

export default router;