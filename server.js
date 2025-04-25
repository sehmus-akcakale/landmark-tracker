const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const path = require('path');

// Routes
const landmarkRoutes = require('./routes/landmarks');
const visitedRoutes = require('./routes/visited');
const authRoutes = require('./routes/auth');
const visitPlanRoutes = require('./routes/visitplans');

// Express app
const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/landmarks', landmarkRoutes);
app.use('/api/visited', visitedRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/visitplans', visitPlanRoutes);

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
});

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error', err));

// Server başlatma
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 