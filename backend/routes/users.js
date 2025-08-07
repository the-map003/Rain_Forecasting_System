const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateJWT, isAdmin } = require('../middleware/authValidation');

// All routes require authentication and admin privileges
router.use(authenticateJWT);

// Get all users
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

// Get users by date range for reports
router.get('/reports/date-range', userController.getUsersByDateRange);

module.exports = router;