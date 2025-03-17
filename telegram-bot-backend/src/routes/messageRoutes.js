const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get messages for a client
router.get('/client/:clientId', messageController.getClientMessages);

// Get unread messages
router.get('/unread', messageController.getUnreadMessages);

// Send message
router.post('/send/:clientId', messageController.sendMessage);

// Mark messages as read
router.post('/mark-read', messageController.markMessagesAsRead);

module.exports = router; 