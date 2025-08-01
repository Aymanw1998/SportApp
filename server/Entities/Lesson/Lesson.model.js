const mongoose = require('mongoose');

// Define the Meeting Schema
const schema = new mongoose.Schema({
    name: String,
    date: {
        day: Number, //0-sun to 6-sat
        hh: Number, //0-23
    },
    max_trainees: Number, // number maximum for clients in lesson
    num_in_list: Number, // number clients in lesson
    trainer: {
        type: mongoose.Schema.Types.ObjectId, // trainer
        ref: 'Users',
    },
    list_trainees: [{
        type: mongoose.Schema.Types.ObjectId, //trainee
        ref: 'Users',
    }],
    created: Date,
    updated: Date,
});

// Create the Meeting model
const Lesson = mongoose.model('Lessons', schema);

module.exports = Lesson;
