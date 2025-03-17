const express = require('express');
const router = express.Router();
const flowResponseController = require('../controllers/flowResponseController');
const { authenticate } = require('../middlewares/authMiddleware');

// Получить все ответы на флоу
router.get('/', authenticate, flowResponseController.getAllResponses);

// Получить ответы по ID флоу
router.get('/flow/:flowId', authenticate, flowResponseController.getResponsesByFlowId);

// Получить форматированные ответы по ID флоу
router.get('/flow/:flowId/formatted', authenticate, flowResponseController.getFormattedResponsesByFlowId);

// Получить ответы по ID клиента
router.get('/client/:clientId', authenticate, flowResponseController.getResponsesByClientId);

// Получить ответ по ID
router.get('/:id', authenticate, flowResponseController.getResponseById);

// Создать новый ответ на флоу
router.post('/', authenticate, flowResponseController.createResponse);

// Обновить существующий ответ на флоу
router.put('/:id', authenticate, flowResponseController.updateResponse);

// Отметить ответ как завершенный
router.put('/:id/complete', authenticate, flowResponseController.completeResponse);

// Удалить ответ на флоу
router.delete('/:id', authenticate, flowResponseController.deleteResponse);

module.exports = router; 