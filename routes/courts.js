import express from 'express';
import Court from "../models/court.js"
import path from "path";
import fs from "fs";

const router = express.Router()

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/all",async(req,res) => {
  const courts = await Court.find();
  if (!courts) return res.status(500).send({message:"Failed to retrieve courts"});
  return res.status(200).send(courts);
});

router.get("/", async (req,res) => {

    const court = await Court.findOne({placesID:req.pid});
    if(!court) res.status(404).send({message:"Court not Found"});

    const imageData = []
    for (let i = 0; i < court.images.length; i++){
        const imagePath = path.join(__dirname, "resources", court.images[i]);
        try {
            const image = fs.readFileSync(imagePath);
            const base64Image = Buffer.from(image).toString("base64");
            imageData.push(base64Image);
        } catch (error) {
            return res.status(400).send({message: "Could not retreive court"});
        }
    }
    res.status(200).send({...court,imageBuffers: imageData});
});

router.post('/', async (req,res) => {

    const location = req.body.location;
    const name = req.body.name;
    const times = req.body.times ? req.body.times:"N/A";
    const placesID = req.body.placesID;
    const lat = req.body.lat;
    const lon = req.body.lon;
    const images = req.body.images; //Grab images.data


    const alreadyUploaded = await Court.findOne({placesID: placesID});
    if (alreadyUploaded) return res.status(400).send({message:"Location Already Added"});

    const imageNames = []

    const resources = path.join(__dirname, "resources");

    const files = fs.readdirSync(resources);
    const numFiles = files.length;
    
    const writeFilePromises = images.map(async (image, index) => {
        const base64Data = image.data;
        const fileExtension = "jpg";
        const filename = `court_image-${numFiles + index + 1}.${fileExtension}`;
        const filePath = path.join(resources, filename);
    
        await fs.promises.writeFile(filePath, base64Data, { encoding: "base64" });
        imageNames.push(filename);
    });
    
    try {
      await Promise.all(writeFilePromises);

      const court = new Court({
        location: location,
        name: name,
        times: times,
        placesID: placesID,
        rating:[],
        lat: lat,
        lon: lon,
        images: imageNames,
      });

      await court.save();
      return res.status(201).send({ message: "Court Uploaded" });
    } catch (err) {
      return res.status(500).send({ message: err });
    }

});

router.put('/:places_id/rating/:score', (req,res)=>{
    var place_id = req.params.places_id;
    var score = req.params.score
    Court.updateOne(
        {placesID:place_id},
        { $push: { rating: score } }
    ).then((court)=>{
        if(court){
            console.log("new",court)
            res.status(201).json(court);
        }
    }).catch((err) => {
        console.log(err);
        res.status(500).json(err);
    });
    
})

export default router