const express = require('express');
const router = express.Router();
const VisitedLandmark = require('../models/VisitedLandmark');
const Landmark = require('../models/Landmark');
const { protect } = require('../middleware/auth');

// Protected routes
router.use(protect);

// POST /visited - 
router.post('/', async (req, res) => {
    try {
        // Check if landmark exists
        const landmark = await Landmark.findOne({
            _id: req.body.landmark_id,
            user_id: req.user._id
        });

        if (!landmark) {
            return res.status(404).json({ message: 'Landmark not found' });
        }

        // Validate visit date
        if (!req.body.visited_date) {
            return res.status(400).json({
                message: 'Visit date is required'
            });
        }

        const visitedLandmark = new VisitedLandmark({
            landmark_id: req.body.landmark_id,
            user_id: req.user._id,
            visitor_name: req.body.visitor_name || req.user.username,
            notes: req.body.notes || '',
            visited_date: new Date(req.body.visited_date),
            rating: req.body.rating || 0
        });

        const newVisit = await visitedLandmark.save();

        // Populate landmark details for response
        const populatedVisit = await VisitedLandmark.findById(newVisit._id)
            .populate('landmark_id');

        res.status(201).json(populatedVisit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /visited - 
router.get('/', async (req, res) => {
    try {
        // Optional query filters
        let query = { user_id: req.user._id };

        // Filter by date
        if (req.query.date) {
            const date = new Date(req.query.date);
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);

            query.visited_date = {
                $gte: date,
                $lt: nextDay
            };
        }

        // Filter by visitor name
        if (req.query.visitor) {
            query.visitor_name = { $regex: req.query.visitor, $options: 'i' };
        }

        // Filter by rating
        if (req.query.rating) {
            query.rating = Number(req.query.rating);
        }

        const visitedLandmarks = await VisitedLandmark.find(query)
            .populate('landmark_id')
            .sort({ visited_date: -1 });


        const validVisits = visitedLandmarks.filter(visit => visit.landmark_id && visit.landmark_id._id);


        if (validVisits.length < visitedLandmarks.length) {
            const invalidVisits = visitedLandmarks.filter(visit => !visit.landmark_id || !visit.landmark_id._id);
            for (const invalidVisit of invalidVisits) {
                await VisitedLandmark.deleteOne({ _id: invalidVisit._id });
                console.log(`Deleted visit for deleted landmark: ${invalidVisit._id}`);
            }
        }

        res.json(validVisits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /visited/:id 
router.get('/landmark/:id', async (req, res) => {
    try {
        const visitedLandmarks = await VisitedLandmark.find({
            landmark_id: req.params.id,
            user_id: req.user._id
        })
            .populate('landmark_id')
            .sort({ visited_date: -1 });

        res.json(visitedLandmarks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /visited/detail/:id 
router.get('/detail/:id', async (req, res) => {
    try {
        const visit = await VisitedLandmark.findOne({
            _id: req.params.id,
            user_id: req.user._id
        }).populate('landmark_id');

        if (!visit) {
            return res.status(404).json({ message: 'Visit record not found' });
        }

        res.json(visit);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /visited/:id 
router.put('/:id', async (req, res) => {
    try {
        const visit = await VisitedLandmark.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!visit) {
            return res.status(404).json({ message: 'Visit record not found' });
        }

        // Update fields if provided
        if (req.body.visited_date) visit.visited_date = new Date(req.body.visited_date);
        if (req.body.visitor_name) visit.visitor_name = req.body.visitor_name;
        if (req.body.notes) visit.notes = req.body.notes;
        if (req.body.rating) visit.rating = req.body.rating;

        const updatedVisit = await visit.save();

        // Populate landmark details for response
        const populatedVisit = await VisitedLandmark.findById(updatedVisit._id)
            .populate('landmark_id');

        res.json(populatedVisit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /visited/:id - Delete a visit record
router.delete('/:id', async (req, res) => {
    try {
        const visit = await VisitedLandmark.findOneAndDelete({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!visit) {
            return res.status(404).json({ message: 'Visit record not found' });
        }

        res.json({ message: 'Visit record deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 