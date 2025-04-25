const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Kayıt ve giriş rotaları
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Korumalı rotalar
router.get('/me', authMiddleware.protect, authController.getMe);

module.exports = router; 