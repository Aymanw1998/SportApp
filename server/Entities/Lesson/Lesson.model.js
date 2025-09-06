const mongoose = require('mongoose');

// Define the Meeting Schema
const schema = new mongoose.Schema({
    name: { type: String, required: true },
    date: {
        day: { type: Number, required: true, min: 1, max: 7 }, // 0=Sun..6=Sat
        hh:  { type: Number, required: true, min: 1, max: 24 }, // 0..23
        month: { type: Number, required: true, min: 1, max: 12 }, // 0..23 
        year: {type: Number, required: true},
    },
    max_trainees: { type: Number, default: 20, min: 0 },
    trainer: {
        type: mongoose.Schema.Types.ObjectId, // trainer
        ref: 'Users',
    },
    list_trainees: [{
        type: mongoose.Schema.Types.ObjectId, //trainee
        ref: 'Users',
    }],
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date},
},{timeseries: false});

// Create the Meeting model
const Lesson = mongoose.model('Lessons', schema);

module.exports = Lesson;
