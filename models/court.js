import mongoose from 'mongoose'

const courtsSchema = new mongoose.Schema({
    name: {     // name of location -- type string & required
        type: String,
        required: true,
    },
    location: { // location for google -- type string & required
        type: String,
        required: true,
    },
    rating: {
        type: [Number],
        default: [0]
    },
    times: {    // meeting times for events -- type string & will just default to "N/A"
        type: [{day:String, start:String, end:String}],
        default: []
    },
    placesID: {
        type: String,
        required: true
    },
    lat:{
        type:Number,
        required:true
    },
    lon:{
        type:Number,
        required:true
    },
    images: {
        type: [String],
        default: []
    }

});

export default mongoose.model('Court',courtsSchema);