const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all clients
router.get('/', clientController.getAllClients);

// Search clients
router.get('/search', clientController.searchClients);

// Get client by ID
router.get('/:id', clientController.getClientById);

// Update client notes
router.put('/:id/notes', clientController.updateNotes);

// Toggle client block status
router.put('/:id/toggle-block', clientController.toggleBlock);

// Toggle dialog status
router.put('/:id/dialog-status', clientController.toggleDialogStatus);

// Обновить язык клиента
router.put('/:id/language', checkRole(['admin', 'super_admin']), clientController.updateClientLanguage);

// Получить список клиентов по языку
router.get('/language/:language', checkRole(['admin', 'super_admin']), clientController.getClientsByLanguage);

// Отправить массовое сообщение клиентам по языку
router.post('/language/:language/message', checkRole(['admin', 'super_admin']), clientController.sendBulkMessageByLanguage);

// Отправить массовое приглашение на поток клиентам по языку
router.post('/language/:language/flow', checkRole(['admin', 'super_admin']), clientController.sendBulkFlowByLanguage);

// Отправить массовое сообщение всем клиентам
router.post('/bulk-message', checkRole(['admin', 'super_admin']), clientController.sendBulkMessage);

// Отправить массовое приглашение на поток всем клиентам
router.post('/bulk-flow', checkRole(['admin', 'super_admin']), clientController.sendBulkFlow);

module.exports = router; 