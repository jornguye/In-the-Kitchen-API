import express from "express";
import User from "../models/user.js";
import FriendRequests from "../models/friendRequest.js";
import verify from "../verify.js";
import path from "path";
import fs from "fs";

const router = express.Router();

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/", verify, async (req, res) => {
  const id = req.id;
  const user = await User.findOne({ _id: id });
  if (user) {
    const imagePath = path.join(__dirname, "resources", user.image);
    try {
      const image = fs.readFileSync(imagePath);
      const base64Image = Buffer.from(image).toString("base64");
      const { password, ...data } = user;
      return res.status(200).send({ ...data, imageData: base64Image });
    } catch (error) {
      const image = fs.readFileSync(path.join(__dirname,"resources","TempProfilePic.jpeg"));
      const base64Image = Buffer.from(image).toString("base64");
      const { password, ...data } = user;
      return res.status(404).send({ ...data, imageData: base64Image,message:"Failed to retrieve image" });
    }
  }
  return res.status(400).send({ message: "ID not Found" });
});

router.get("/pfp", verify, async (req, res) => {
  const id = req.id;
  const user = await User.findOne({ _id: id });
  if (user) {
    const imagePath = path.join(__dirname, "resources", user.image);
    try {
      const image = fs.readFileSync(imagePath);
      const base64Image = Buffer.from(image).toString("base64");
      return res.status(200).send({ imageData: base64Image });
    } catch (error) {
      console.log("Error in get pfp", error);
      return res.status(500).send({ message: "Failed to read the image file" });
    }
  }
  return res.status(404).send({ message: "ID not Found" });
});

router.put("/pfp", verify, async (req, res) => {
  const id = req.id;

  //save image from request under user_pfp-x.png
  //Meet with nick for image handling
  //const filename = req.body.image.name ????????

  const resources = path.join(__dirname, "resources");

  const files = fs.readdirSync(resources);
  const numFiles = files.length;

  const uri = req.body.uri;
  const base64Data = uri.split(";base64,").pop(); // Extract base64 data without the prefix
  // return;

  const fileExtension = "jpg";
  const filename = `user_image-${numFiles + 1}.${fileExtension}`;
  const filePath = path.join(resources, filename);

  fs.writeFile(filePath, base64Data, { encoding: "base64" }, async (err) => {
    if (err || !User.findOne({ _id: id })) {
      return res.status(500).send({ message: "Failed to update image" });
    } else {
      const user = await User.updateOne({ _id: id }, { image: filename });
      if (user) return res.status(201).send({ message: "Image Updated" });
      return res.status(404).send({ message: "ID not Found" });
    }
  });
});

router.put("/bio", verify, async (req, res) => {
  const id = req.id;
  const user = await User.findOne({ _id: id });
  if (!user) return res.status(404).send({ message: "ID not Found" });
  const success = await User.updateOne({ _id: id }, { bio: req.body.bio });
  if (success) return res.status(200).send({ message: "Bio Updated" });
  return res.status(500).send({ message: "Internal Server Error" });
});

router.put("/friend/request", verify, async (req, res) => {
  const id = req.id;
  const user = await User.findOne({ _id: id });
  if (!user) return res.status(404).send({ message: "Access Denied: Failed to add friend" });

  const isFriend = user.friends.some((existingFriend) => existingFriend === req.body.username);
  if (isFriend) return res.status(400).send({ message: "This Person is Already your Friend" });
  
  if (user.username === req.body.username) return res.status(400).send({message:"You Can't Add Yourself as a Friend!"})
  
  const friend = await User.findOne({ username: req.body.username });
  if (!friend) return res.status(404).send({ message: "User not Found" });

  const isPending = await FriendRequests.findOne({
    sender: user.username, 
    receiver: friend.username
  }) || await FriendRequests.findOne({
    receiver: user.username, 
    sender: friend.username
  }); 

  if (isPending) return res.status(400).send({message:"A Friend Request for This User is Pending"})

  const request = new FriendRequests({
    receiver: friend.username,
    sender: user.username
  });

  try{
    await request.save();
    await User.updateOne({_id:id},{$push: {friendRequests: request._id}});
    await User.updateOne({_id:friend._id},{$push:{friendRequests: request._id}});
    return res.status(201).send({message: "Friend Request Sent!"});
  } catch(e) {
    console.log(e);
  } 

  return res.status(500).send({ message: "Internal Server Error: Failed to add friend" });
});

router.get("/friends", verify, async (req, res) => {
  const id = req.id;
  const user = await User.findOne({ _id: id });
  if (!user) return res.status(404).send({ message: "Access Denied: Failed to get friends" });
  const friends = []
  for (let i = 0; i < user.friends.length; i++){
    const friend = await User.findOne({username: user.friends[i]});
    friends.push({fName:friend.fName,lName:friend.lName,username:friend.username,bio:friend.bio,image:friend.image})
  }
  return res.status(200).send({friends: friends});
});

router.get("/friends/requests", verify, async (req, res) => {
  const id = req.id;
  const user = await User.findOne({ _id: id });
  if (!user) return res.status(404).send({ message: "Access Denied: Failed to get friends" });
  
  // for id in user.friendRequests: add request.sender to requestsIn if request.receiver.username == user.username otherwise add request.receiver to requestsOut
  const requestsIn = []
  const requestsOut = []

  for (let i = 0; i < user.friendRequests.length; i++){

    const request = await FriendRequests.findOne({_id:user.friendRequests[i]._id});

    if (!request) continue;
    
    const sender = await User.findOne({username:request.sender});
    const receiver = await User.findOne({username:request.receiver});

    if (!sender || !receiver){ 
      await FriendRequests.deleteOne({_id:user.friendRequests[i]._id})
      continue;
    }

    if (request.receiver === user.username){
      const senderData = {fName:sender.fName ,lName:sender.lName,username:sender.username,image:sender.image};
      requestsIn.push({...senderData,reqId: request._id});
    }
    else {
      const receiverData = {fName:receiver.fName ,lName:receiver.lName,username:receiver.username,image:receiver.image};
      requestsOut.push({...receiverData,reqId: request._id});
    }
    
  }
  return res.status(200).send({requestsIn:requestsIn,requestsOut:requestsOut})
});

export default router;
