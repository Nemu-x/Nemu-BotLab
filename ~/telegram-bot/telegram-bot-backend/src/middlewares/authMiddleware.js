const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Временное решение: пропускаем аутентификацию
const authenticate = (req, res, next) => {
  // В реальном приложении здесь должна быть проверка JWT токена
  // Но пока просто пропускаем все запросы
  next();
};

// Для будущей реализации:
const authenticateWithToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      req.user = decoded;
      next();
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = {
  authenticate,
  authenticateWithToken
}; 