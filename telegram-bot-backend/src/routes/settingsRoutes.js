const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// All routes require authentication
router.use(authMiddleware);

// Get settings - доступно всем аутентифицированным пользователям
router.get('/', settingsController.getSettings);

// Update settings - только для admin и super_admin
router.put('/', checkRole(['admin', 'super_admin']), settingsController.updateSettings);
router.post('/', checkRole(['admin', 'super_admin']), settingsController.updateSettings);

module.exports = router; 