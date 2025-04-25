const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify user authentication
exports.protect = async (req, res, next) => {
    let token;

    // Get token from header or cookie
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Get token from header
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
        // Get token from cookie
        token = req.cookies.token;
    }

    // Return error if no token
    if (!token) {
        return res.status(401).json({
            message: 'You need to log in to perform this action'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by ID from token
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: 'No user found with this token'
            });
        }

        // Add user to request
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            message: 'Unauthorized access'
        });
    }
}; 