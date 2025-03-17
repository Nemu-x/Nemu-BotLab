const express = require('express');
const router = express.Router();
const dialogController = require('../controllers/dialogController');
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all dialog routes
router.use(authMiddleware);

// GET /api/dialogs - Get all dialogs
router.get('/', dialogController.getAllDialogs);

// GET /api/dialogs/:id - Get a single dialog by ID
router.get('/:id', dialogController.getDialogById);

// POST /api/dialogs - Create a new dialog
router.post('/', dialogController.createDialog);

// PUT /api/dialogs/:id - Update a dialog
router.put('/:id', dialogController.updateDialog);

// PATCH /api/dialogs/:id/status - Update dialog status
router.patch('/:id/status', dialogController.updateDialogStatus);

// DELETE /api/dialogs/:id - Delete a dialog
router.delete('/:id', dialogController.deleteDialog);

module.exports = router; 