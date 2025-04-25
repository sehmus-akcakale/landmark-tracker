const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const visitPlanSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    planned_date: {
        type: Date,
        required: true
    },
    landmarks: [
        {
            landmark_id: {
                type: Schema.Types.ObjectId,
                ref: 'Landmark',
                required: true
            },
            notes: {
                type: String
            }
        }
    ],
    overall_notes: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Middleware to handle landmark deletion
visitPlanSchema.pre('save', async function (next) {
    if (this.isModified('landmarks')) {
        // Filter out any landmarks that might have been deleted
        const Landmark = mongoose.model('Landmark');
        const validLandmarks = [];

        for (const landmark of this.landmarks) {
            try {
                const exists = await Landmark.findById(landmark.landmark_id);
                if (exists) {
                    validLandmarks.push(landmark);
                }
            } catch (err) {
                console.error('Error checking landmark existence:', err);
            }
        }

        this.landmarks = validLandmarks;
    }
    next();
});

module.exports = mongoose.model('VisitPlan', visitPlanSchema); 