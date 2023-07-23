import express from "express";
import User from "../models/user.js";
import verify from "../verify.js";
import path from "path";
import fs from "fs";

const router = express.Router();

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/:path", async (req, res) => {
    const imagePath = path.join(__dirname, "resources", req.params.path);
    try {
      const image = fs.readFileSync(imagePath);
      const base64Image = Buffer.from(image).toString("base64");
      return res.status(200).send({ imageData: base64Image });
    } catch (error) {
      const tempPath = path.join(__dirname, "resources", "NotFound.png");
      const image = fs.readFileSync(tempPath);
      const base64Image = Buffer.from(image).toString("base64");
      return res.status(500).send({ message: "Failed to read the image file",imageData:base64Image });
    }

});

router.get("/users/:username", verify, async (req, res) => {

  const id = req.id;
  const user = await User.findOne({_id:id,friends:req.params.username});
  if (!user) {
    const tempPath = path.join(__dirname, "resources", "TempProfilePic.jpeg");
    const image = fs.readFileSync(tempPath);
    const base64Image = Buffer.from(image).toString("base64");
    return res.status(400).send({message:"This user is not your friend",imageData: base64Image});
  }
  const friend = await User.findOne({username: req.params.username});
  if (!friend) return res.status(404).send({message:"Failed to retrieve friend"});
  const imagePath = path.join(__dirname, "resources", friend.image);
  try {
    const image = fs.readFileSync(imagePath);
    const base64Image = Buffer.from(image).toString("base64");
    return res.status(200).send({ message: "Success",imageData: base64Image });
  } catch (error) {
    const tempPath = path.join(__dirname, "resources", "TempProfilePic.jpeg");
    const image = fs.readFileSync(tempPath);
    const base64Image = Buffer.from(image).toString("base64");
    return res.status(500).send({ message: "Failed to read the image file",imageData:base64Image });
  }

});

export default router;
