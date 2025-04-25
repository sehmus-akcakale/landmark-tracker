const express = require('express');
const router = express.Router();
const VisitPlan = require('../models/VisitPlan');
const Landmark = require('../models/Landmark');
const { protect } = require('../middleware/auth');

// Protected routes
router.use(protect);

// POST /visitplans - Create new visit plan
router.post('/', async (req, res) => {
    try {
        // Validate request
        if (!req.body.name || !req.body.landmarks || req.body.landmarks.length === 0) {
            return res.status(400).json({
                message: 'Please provide a name and at least one landmark'
            });
        }

        // Validate landmarks
        for (const landmark of req.body.landmarks) {
            const exists = await Landmark.findOne({
                _id: landmark.landmark_id,
                user_id: req.user._id
            });

            if (!exists) {
                return res.status(404).json({
                    message: `Landmark with ID ${landmark.landmark_id} not found or not owned by you`
                });
            }
        }

        // Create visit plan
        const visitPlan = new VisitPlan({
            user_id: req.user._id,
            name: req.body.name,
            planned_date: req.body.planned_date || new Date(),
            landmarks: req.body.landmarks,
            overall_notes: req.body.overall_notes || ''
        });

        const newVisitPlan = await visitPlan.save();

        // Populate landmark details for response
        const populatedPlan = await VisitPlan.findById(newVisitPlan._id)
            .populate({
                path: 'landmarks.landmark_id',
                select: 'name location category'
            });

        res.status(201).json(populatedPlan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /visitplans - Get all visit plans for current user
router.get('/', async (req, res) => {
    try {
        const visitPlans = await VisitPlan.find({ user_id: req.user._id })
            .populate({
                path: 'landmarks.landmark_id',
                select: 'name location category'
            })
            .sort({ created_at: -1 });

        res.json(visitPlans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /visitplans/:id - Get specific visit plan
router.get('/:id', async (req, res) => {
    try {
        const visitPlan = await VisitPlan.findOne({
            _id: req.params.id,
            user_id: req.user._id
        }).populate({
            path: 'landmarks.landmark_id',
            select: 'name location description category'
        });

        if (!visitPlan) {
            return res.status(404).json({ message: 'Visit plan not found' });
        }

        res.json(visitPlan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /visitplans/:id - Update a visit plan
router.put('/:id', async (req, res) => {
    try {
        const visitPlan = await VisitPlan.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!visitPlan) {
            return res.status(404).json({ message: 'Visit plan not found' });
        }

        // Validate landmarks if provided
        if (req.body.landmarks && req.body.landmarks.length > 0) {
            for (const landmark of req.body.landmarks) {
                const exists = await Landmark.findOne({
                    _id: landmark.landmark_id,
                    user_id: req.user._id
                });

                if (!exists) {
                    return res.status(404).json({
                        message: `Landmark with ID ${landmark.landmark_id} not found or not owned by you`
                    });
                }
            }
            visitPlan.landmarks = req.body.landmarks;
        }

        // Update other fields if provided
        if (req.body.name) visitPlan.name = req.body.name;
        if (req.body.planned_date) visitPlan.planned_date = new Date(req.body.planned_date);
        if (req.body.overall_notes) visitPlan.overall_notes = req.body.overall_notes;

        const updatedPlan = await visitPlan.save();

        // Populate landmark details for response
        const populatedPlan = await VisitPlan.findById(updatedPlan._id)
            .populate({
                path: 'landmarks.landmark_id',
                select: 'name location category'
            });

        res.json(populatedPlan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /visitplans/:id - Delete a visit plan
router.delete('/:id', async (req, res) => {
    try {
        const visitPlan = await VisitPlan.findOneAndDelete({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!visitPlan) {
            return res.status(404).json({ message: 'Visit plan not found' });
        }

        res.json({ message: 'Visit plan deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 