const mongoose = require('mongoose');

// Define the Meeting Schema
const schema = new mongoose.Schema({
    tz: String,
    username:String,
    password: String,
    firstname: String,
    lastname: String,
    birth_date: String,
    gender: { type: String, enum: ['זכר', "נקבה", "נקיבה"]},
    phone: String,
    email: String,
    city: String,
    street: String,
    role: { type: String, enum: ['מנהל', 'מאמן', 'מתאמן'] },
    list_class: [{        
        type: mongoose.Schema.Types.ObjectId, //'מאמן', 'מתאמן'
        ref: 'Lessons',
    }],
    max_class:Number, //'מתאמן'
    created: Date,
    updated: Date,
    refreshToken: { type: String, default: null },
    subs: {
        type: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subs"
            },
        start: {
            day: Number, month: Number, year: Number,
        }
    },
    wallet: Number,
    active: Number,
});

// Create the Meeting model
const User = mongoose.model('Users', schema);

module.exports = User;
