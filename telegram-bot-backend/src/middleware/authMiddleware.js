const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Middleware для проверки аутентификации пользователя
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkAuth = async (req, res, next) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Верифицируем токен
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Получаем пользователя из базы данных
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }]
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }
    
    if (!user.is_active) {
      return res.status(403).json({ error: 'Forbidden: User is inactive' });
    }
    
    // Добавляем информацию о пользователе в объект запроса
    req.user = user;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

/**
 * Middleware для проверки роли пользователя
 * @param {Array} allowedRoles - Массив разрешенных ролей
 * @returns {Function} Middleware функция
 */
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Сначала проверяем аутентификацию
      await checkAuth(req, res, async () => {
        // Проверяем, есть ли у пользователя нужная роль
        const userRole = req.user.role ? req.user.role.name : null;
        
        if (!userRole || !allowedRoles.includes(userRole)) {
          return res.status(403).json({ 
            error: 'Forbidden: Insufficient permissions',
            requiredRoles: allowedRoles,
            userRole
          });
        }
        
        next();
      });
    } catch (error) {
      logger.error('Role check error:', error);
      return res.status(500).json({ error: 'Internal server error during role check' });
    }
  };
};

module.exports = {
  checkAuth,
  checkRole
}; 