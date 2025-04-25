const mongoose = require('mongoose');

const visitedLandmarkSchema = new mongoose.Schema({
    landmark_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Landmark',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    visited_date: {
        type: Date,
        required: true
    },
    visitor_name: {
        type: String,
        default: 'Anonymous'
    },
    notes: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Middleware to handle landmark deletion cascade
visitedLandmarkSchema.pre('findOne', function (next) {
    this.populate('landmark_id');
    next();
});

module.exports = mongoose.model('VisitedLandmark', visitedLandmarkSchema); 