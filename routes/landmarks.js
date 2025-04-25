const express = require('express');
const router = express.Router();
const Landmark = require('../models/Landmark');
const { protect } = require('../middleware/auth');

// Korumalı rotalar
router.use(protect);

// GET /landmarks - Tüm landmarkları getir, arama ve filtreleme özellikleri ile
router.get('/', async (req, res) => {
    try {

        let query = { user_id: req.user._id };


        if (req.query.name) {
            query.name = { $regex: req.query.name, $options: 'i' };
        }


        if (req.query.category) {
            query.category = req.query.category;
        }


        if (req.query.description) {
            query.description = { $regex: req.query.description, $options: 'i' };
        }

        // Konum yakınlığına göre filtreleme
        /*
        if (req.query.lat && req.query.lng && req.query.distance) {
            // Basit bir konum araması, gerçek projede daha gelişmiş bir coğrafi arama yapılabilir
            const lat = parseFloat(req.query.lat);
            const lng = parseFloat(req.query.lng);
            const distance = parseFloat(req.query.distance);

            // Min/max değerleri hesapla
            const latMin = lat - distance;
            const latMax = lat + distance;
            const lngMin = lng - distance;
            const lngMax = lng + distance;

            query['location.latitude'] = { $gte: latMin.toString(), $lte: latMax.toString() };
            query['location.longitude'] = { $gte: lngMin.toString(), $lte: lngMax.toString() };
        }
        */

        const landmarks = await Landmark.find(query);
        res.json(landmarks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /landmarks/:id  
router.get('/:id', async (req, res) => {
    try {
        const landmark = await Landmark.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!landmark) {
            return res.status(404).json({ message: 'Landmark not found' });
        }
        res.json(landmark);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /landmarks 
router.post('/', async (req, res) => {
    const landmark = new Landmark({
        name: req.body.name,
        user_id: req.user._id,
        location: {
            latitude: req.body.location.latitude,
            longitude: req.body.location.longitude
        },
        description: req.body.description,
        category: req.body.category
    });

    try {
        const newLandmark = await landmark.save();
        res.status(201).json(newLandmark);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /landmarks/:id 
router.put('/:id', async (req, res) => {
    try {
        const landmark = await Landmark.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!landmark) {
            return res.status(404).json({ message: 'Landmark not found' });
        }

        if (req.body.name) landmark.name = req.body.name;
        if (req.body.location) {
            landmark.location.latitude = req.body.location.latitude || landmark.location.latitude;
            landmark.location.longitude = req.body.location.longitude || landmark.location.longitude;
        }
        if (req.body.description) landmark.description = req.body.description;
        if (req.body.category) landmark.category = req.body.category;

        const updatedLandmark = await landmark.save();
        res.json(updatedLandmark);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /landmarks/:id 
router.delete('/:id', async (req, res) => {
    try {
        const landmark = await Landmark.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!landmark) {
            return res.status(404).json({ message: 'Landmark not found' });
        }

        await Landmark.findByIdAndDelete(req.params.id);
        res.json({ message: 'Landmark deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 