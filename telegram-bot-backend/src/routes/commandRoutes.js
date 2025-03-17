const express = require('express');
const router = express.Router();
const commandController = require('../controllers/commandController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// All routes require authentication
router.use(authMiddleware);

// Get all commands - доступно всем аутентифицированным пользователям
router.get('/', commandController.getAllCommands);

// Create new command - только для admin и super_admin
router.post('/', checkRole(['admin', 'super_admin']), commandController.createCommand);

// Update command - только для admin и super_admin
router.put('/:id', checkRole(['admin', 'super_admin']), commandController.updateCommand);

// Delete command - только для admin и super_admin
router.delete('/:id', checkRole(['admin', 'super_admin']), commandController.deleteCommand);

module.exports = router; 