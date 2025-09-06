const mongoose = require('mongoose');

// Define the Meeting Schema
const schema = new mongoose.Schema({
    name: {type: String, required: true},
    months: {type: Number, required: true, min: 1},
    times_week: {type: Number, required: true, min: 1, max: 7},
    price: {type: Number,required: true, min: 0},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date},
});

// Create the Meeting model
const Subs = mongoose.model('Subs', schema);

module.exports = Subs;
