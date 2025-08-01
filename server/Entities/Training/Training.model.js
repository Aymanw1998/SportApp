const mongoose = require('mongoose');

// Define the Meeting Schema
const schema = new mongoose.Schema({
    name: String,
    info: String,
});

// Create the Meeting model
const Training = mongoose.model('Training', schema);

module.exports = Training;
