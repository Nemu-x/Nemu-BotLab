const express = require('express');
const router = express.Router();
const flowController = require('../controllers/flowController');
const { authenticate } = require('../middlewares/authMiddleware');
const checkRole = require('../middleware/checkRole');

// Apply auth middleware to all routes
router.use(authenticate);

// Routes available to all authenticated users
router.get('/', flowController.getAllFlows);
router.get('/:id', flowController.getFlowById);
router.get('/:id/commands', flowController.getFlowCommands);
router.get('/:id/steps', checkRole(['admin', 'super_admin']), flowController.getFlowSteps);

// Routes that require admin or super_admin role
router.post('/', checkRole(['admin', 'super_admin']), flowController.createFlow);
router.put('/:id', checkRole(['admin', 'super_admin']), flowController.updateFlow);
router.delete('/:id', checkRole(['admin', 'super_admin']), flowController.deleteFlow);

// Маршруты для работы с шагами опросника - только для admin и super_admin
router.post('/:id/steps', checkRole(['admin', 'super_admin']), flowController.addFlowStep);
router.put('/:id/steps/:stepId', checkRole(['admin', 'super_admin']), flowController.updateFlowStep);
router.delete('/:id/steps/:stepId', checkRole(['admin', 'super_admin']), flowController.deleteFlowStep);

// Маршрут для установки flow как default - только для admin и super_admin
router.post('/:id/set-default', checkRole(['admin', 'super_admin']), flowController.setDefaultFlow);

// Маршрут для отправки приглашения пройти опросник
router.post('/:id/invite', checkRole(['admin', 'super_admin']), flowController.sendFlowInvitation);

module.exports = router; 