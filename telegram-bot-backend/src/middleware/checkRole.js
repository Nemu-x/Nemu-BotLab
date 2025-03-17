/**
 * Middleware для проверки роли пользователя
 * @param {string[]} allowedRoles - массив разрешенных ролей
 * @returns {function} - middleware функция
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // В режиме разработки временно пропускаем эту проверку
      // Это позволит работать, пока у нас нет JWT аутентификации
      next();
      return;

      // ПРИМЕЧАНИЕ: Код ниже будет использоваться, когда у нас будет реальная аутентификация
      
      // Проверяем, есть ли у пользователя (req.user) роль
      if (!req.user || !req.user.role) {
        return res.status(403).json({ error: 'Access denied: role information not available' });
      }

      const userRole = req.user.role;
      
      // Проверяем, входит ли роль пользователя в список разрешенных
      if (allowedRoles.includes(userRole)) {
        next();
      } else {
        return res.status(403).json({ 
          error: 'Access denied: insufficient privileges',
          required: allowedRoles,
          current: userRole 
        });
      }
    } catch (error) {
      console.error('Role check middleware error:', error);
      res.status(500).json({ error: 'Internal server error during role check' });
    }
  };
};

module.exports = checkRole; 