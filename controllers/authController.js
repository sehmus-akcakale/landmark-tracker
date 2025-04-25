const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Create JWT token
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// Create and send token as response
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Send token in cookie
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_EXPIRES_IN.match(/\d+/)[0] * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    res.cookie('token', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        token,
        data: {
            user
        }
    });
};

// User registration
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Create user
        const user = await User.create({
            username,
            email,
            password
        });

        createSendToken(user, 201, res);
    } catch (err) {
        res.status(400).json({
            message: err.message
        });
    }
};

// User login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                message: 'Please provide email and password'
            });
        }

        // Find user (+password)
        const user = await User.findOne({ email }).select('+password');

        // Check if user exists and password is correct
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({
                message: 'Incorrect email or password'
            });
        }

        createSendToken(user, 200, res);
    } catch (err) {
        res.status(400).json({
            message: err.message
        });
    }
};

// User logout
exports.logout = (req, res) => {
    res.cookie('token', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        message: 'Logged out successfully'
    });
};

// Get current user
exports.getMe = async (req, res) => {
    res.status(200).json({
        data: {
            user: req.user
        }
    });
}; 