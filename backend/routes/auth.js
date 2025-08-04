const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateSignup, validateLogin, authenticateJWT } = require('../middleware/authValidation');

// Signup route
router.post('/signup', validateSignup, authController.signup);

// Login route
router.post('/login', validateLogin, authController.login);

// Get user info (protected route)
router.get('/getUser', authenticateJWT, authController.getUserInfo);

// Admin register user route (protected route)
router.post('/admin-register', authenticateJWT, authController.adminRegisterUser);

// Add this to the existing routes

// Change password route (protected route)
router.post('/change-password', authenticateJWT, authController.changePassword);

module.exports = router;
