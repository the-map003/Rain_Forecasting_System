const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { 
    validateSignup, 
    validateLogin, 
    authenticateJWT, 
    isAdmin,
    validateAdminRegister,
    validatePasswordChange 
} = require('../middleware/authValidation');

// Signup route
router.post('/signup', validateSignup, authController.signup);

// Login route
router.post('/login', validateLogin, authController.login);

// Get user info (protected route)
router.get('/getUser', authenticateJWT, authController.getUserInfo);

// Admin register new user (protected route, admin only)
router.post('/admin/register', authenticateJWT, isAdmin, validateAdminRegister, authController.adminRegisterUser);

// Change password (protected route)
router.post('/change-password', authenticateJWT, validatePasswordChange, authController.changePassword);

module.exports = router;
