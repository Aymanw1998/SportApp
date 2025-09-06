const mongoose = require('mongoose');

// Define the Meeting Schema
const schema = new mongoose.Schema({
    name: {type: String, required: true,},
    info: {type: String, default: ''},

    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date},
});

// Create the Meeting model
const Training = mongoose.model('Training', schema);

module.exports = Training;
