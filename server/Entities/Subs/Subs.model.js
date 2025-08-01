const mongoose = require('mongoose');

// Define the Meeting Schema
const schema = new mongoose.Schema({
    name: String,
    months: Number, // 1,2,3
    times_week: Number, //2,3,4
    price: Number,
});

// Create the Meeting model
const Subs = mongoose.model('Subs', schema);

module.exports = Subs;
