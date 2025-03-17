const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { checkRole } = require('../middleware/authMiddleware');

// Получить все заявки
router.get('/', checkRole(['admin', 'super_admin', 'operator']), ticketController.getAllTickets);

// Получить заявку по ID
router.get('/:id', checkRole(['admin', 'super_admin', 'operator']), ticketController.getTicketById);

// Создать новую заявку
router.post('/', checkRole(['admin', 'super_admin', 'operator']), ticketController.createTicket);

// Обновить заявку
router.put('/:id', checkRole(['admin', 'super_admin', 'operator']), ticketController.updateTicket);

// Удалить заявку
router.delete('/:id', checkRole(['admin', 'super_admin']), ticketController.deleteTicket);

// Назначить заявку оператору
router.put('/:id/assign/:operatorId', checkRole(['admin', 'super_admin']), ticketController.assignTicketToOperator);

// Изменить статус заявки
router.put('/:id/status/:status', checkRole(['admin', 'super_admin', 'operator']), ticketController.changeTicketStatus);

// Получить заявки по клиенту
router.get('/client/:clientId', checkRole(['admin', 'super_admin', 'operator']), ticketController.getTicketsByClient);

// Получить заявки по оператору
router.get('/operator/:operatorId', checkRole(['admin', 'super_admin', 'operator']), ticketController.getTicketsByOperator);

module.exports = router; 