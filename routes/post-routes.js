import express from 'express';
import Post from "../models/post.js";
import User from "../models/user.js";
import verify from "../verify.js";
import path from "path";
import fs from "fs";

const router = express.Router()

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post("/", verify, async (req,res)=>{

    const id = req.id;
    const body = req.body.body;
    const user = await User.findOne({_id: id});
    if (!user) return res.status(400).send({message: "Failed to upload post"});
    const date = req.body.date;
    const username = user.username;
    const images = req.body.images;
    //for each in req.body.images save image with new name 
    const imageNames = []

    const resources = path.join(__dirname, "resources");

    const files = fs.readdirSync(resources);
    const numFiles = files.length;
    
    const writeFilePromises = images.map(async (image, index) => {
        
        const base64Data = image;
        const fileExtension = "jpg";
        const filename = `posts_image-${numFiles + index + 1}.${fileExtension}`;
        const filePath = path.join(resources, filename);
    
        await fs.promises.writeFile(filePath, base64Data, { encoding: "base64" });
        imageNames.push(filename);

    });
    
    try {
      await Promise.all(writeFilePromises);

      const post = new Post({
        body: body,
        date: date,
        u_id: username,
        images: imageNames,
      });

      await post.save();
      return res.status(201).send({ message: "Post Uploaded" });

    } catch (err) {
      console.log(err);
      return res.status(500).send({ message: "An error occured while posting." });
    }
})

router.get("/",verify, async(req,res) => {
    const user = await User.findOne({_id:req.id});
    const posts = await Post.find().sort({'_id':-1});
    if (!user || !posts) return res.status(400).send({message:"Content Not Found"}); 
    const filteredPosts = posts.filter(post => user.friends.includes(post.u_id) || post.u_id === user.username);
    res.status(200).send({message:"Success",posts: filteredPosts});
});

export default router;