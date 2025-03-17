const express = require('express');
const dialogController = require('../controllers/dialogController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Применяем middleware аутентификации ко всем маршрутам
router.use(authenticate);

// Получить все диалоги
router.get('/', dialogController.getAllDialogs);

// Получить диалог по ID
router.get('/:id', dialogController.getDialogById);

// Создать новый диалог
router.post('/', dialogController.createDialog);

// Обновить диалог
router.put('/:id', dialogController.updateDialog);

// Обновить статус диалога
router.put('/:id/status', dialogController.updateDialogStatus);

// Удалить диалог
router.delete('/:id', dialogController.deleteDialog);

module.exports = router; 