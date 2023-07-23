import express from 'express';
import User from "../models/user.js"
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

const router = express.Router()

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/", (req,res) => res.send("In top-level auth route"))
router.post('/register', async (req,res) => {
    //validation
    /*
    const {error} = registerValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    */

    //check user in database
    const userExists = await User.findOne({username:req.body.username});
    if(userExists) return res.status(404).send({message: "Username is Taken"});

    //Password Hashing
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
        username: req.body.username,
        fName: req.body.fName,
        lName: req.body.lName,
        password: hashPassword
    });

    const token = jwt.sign({id:user._id}, process.env.TOKEN_SECRET);

    try {
        user.save(); //saves to database
        const {password,...data} = user;
        data.token = token;
        const imagePath = path.join(__dirname, "resources", user.image);
        const image = fs.readFileSync(imagePath);
        const base64Image = Buffer.from(image).toString("base64");
        data.imageData = base64Image;
        return res.status(200).send({user: true, ...data});
    }catch(err) {
        return res.status(500).send({message: err});
    }

});

router.post('/login',async (req,res) => {

    const user = await User.findOne({"username":req.body.username});
    if(!user) return res.status(404).send({message:"Username Not Found"});
    
    const validPassword = await bcrypt.compare(req.body.password,user.password);
    if(!validPassword) return res.status(404).json({message:"Invalid Password"});

    //Token for Authentication
    const token = jwt.sign({id:user._id}, process.env.TOKEN_SECRET);

    const imagePath = path.join(__dirname, "resources", user.image);

    try {
        const image = fs.readFileSync(imagePath);
        const base64Image = Buffer.from(image).toString("base64");
        const {password,...data} = user;
        data.imageData = base64Image;
        data.token = token;
        data.message = "login successful";
        return res.status(200).send({...data});
    } catch (error) {
        const image = fs.readFileSync(path.join(__dirname,"resources","TempProfilePic.jpeg"));
        const base64Image = Buffer.from(image).toString("base64");
        const { password, ...data } = user;
        data.token = token;
        data.message = "login successful";
        data.imageData = base64Image;
        return res.status(404).send({ ...data });
    }

});

export default router