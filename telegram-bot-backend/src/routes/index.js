const express = require('express');
const router = express.Router();

const commandRoutes = require('./commandRoutes');
const userRoutes = require('./userRoutes');
const messageRoutes = require('./messageRoutes');
const clientRoutes = require('./clientRoutes');
const settingsRoutes = require('./settingsRoutes');
const flowRoutes = require('./flowRoutes');
const flowResponseRoutes = require('./flowResponseRoutes');
const dialogRoutes = require('./dialogRoutes');
const ticketRoutes = require('./ticketRoutes');
const authMiddleware = require('../middleware/authMiddleware');

// Подключаем контроллер дашборда
const dashboardController = require('../controllers/dashboardController');

router.use('/commands', commandRoutes);
router.use('/users', userRoutes);
router.use('/messages', messageRoutes);
router.use('/clients', clientRoutes);
router.use('/settings', settingsRoutes);
router.use('/flows', flowRoutes);
router.use('/flow-responses', flowResponseRoutes);
router.use('/dialogs', dialogRoutes);
router.use('/tickets', ticketRoutes);

// Маршруты для дашборда
router.get('/dashboard/stats', authMiddleware.checkAuth, dashboardController.getStats);
router.get('/dashboard/activity', authMiddleware.checkAuth, dashboardController.getActivity);
router.get('/dashboard/time-analytics', authMiddleware.checkAuth, dashboardController.getTimeAnalytics);

module.exports = router; 