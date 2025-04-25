const mongoose = require('mongoose');

const landmarkSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        latitude: {
            type: String,
            required: true
        },
        longitude: {
            type: String,
            required: true
        }
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['historical', 'natural', 'cultural', 'other'],
        default: 'other'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Landmark', landmarkSchema); 