const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes requiring authentication
router.use(authMiddleware);

// Routes for all authenticated users
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/change-password', userController.changePassword);

// Admin-only routes
router.use(checkRole(['admin', 'super_admin']));

// Get all users (admin only)
router.get('/', userController.getAllUsers);

// Create user (admin only)
router.post('/', userController.createUser);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router; 