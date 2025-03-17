const { User, Role } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const userController = {
  // User registration
  async register(req, res) {
    try {
      const { email, password, username, role, isActive } = req.body;
      
      logger.info(`Регистрация пользователя: ${JSON.stringify({ email, username, role })}`);
      
      // Найдем ID роли
      let roleRecord;
      if (role) {
        // Если роль указана, ищем её
        roleRecord = await Role.findOne({ where: { name: role } });
        if (!roleRecord) {
          logger.warn(`Роль не найдена: ${role}`);
          return res.status(400).json({ error: `Role not found: ${role}` });
        }
      } else {
        // Если роль не указана, используем 'operator' по умолчанию
        roleRecord = await Role.findOne({ where: { name: 'operator' } });
        if (!roleRecord) {
          logger.error('Роль operator не найдена в системе');
          return res.status(400).json({ error: 'Default role not found' });
        }
      }

      // Создаем пользователя с указанной ролью
      const user = await User.create({
        email,
        username,
        password: password,
        role_id: roleRecord.id,
        is_active: isActive !== undefined ? isActive : true
      });

      logger.info(`Пользователь создан: ${user.id}, роль: ${roleRecord.name}`);

      // Для метода регистрации через API возвращаем данные пользователя без пароля
      if (req.originalUrl === '/api/users') {
        return res.status(201).json({
          id: user.id,
          email: user.email,
          username: user.username,
          role_id: user.role_id,
          is_active: user.is_active
        });
      }

      // Для обычной регистрации возвращаем токен
      const token = jwt.sign(
        { id: user.id, email: user.email, role_id: user.role_id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({ token });
    } catch (error) {
      logger.error('Ошибка при регистрации:', error);
      res.status(400).json({ error: error.message });
    }
  },

  // User login
  async login(req, res) {
    try {
      const { email, password, username } = req.body;
      
      // Добавляем подробное логирование
      logger.info(`Попытка входа с данными: email=${email}, username=${username}`);
      
      // Ищем пользователя по email или username
      const whereClause = {};
      if (email) {
        whereClause.email = email;
      } else if (username) {
        whereClause.username = username;
      } else {
        return res.status(400).json({ error: 'Email or username is required' });
      }

      logger.info(`Поиск пользователя с условием:`, whereClause);
      
      const user = await User.findOne({ 
        where: whereClause,
        include: [{
          model: Role,
          as: 'role',
          attributes: ['name']
        }]
      });

      logger.info(`Найден пользователь:`, user ? { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role?.name 
      } : 'null');

      if (!user) {
        logger.warn(`Пользователь не найден с ${email ? 'email: ' + email : 'username: ' + username}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await user.validatePassword(password);
      logger.info(`Валидация пароля: ${isPasswordValid ? 'успешно' : 'неудачно'}`);

      if (!isPasswordValid) {
        logger.warn(`Неверный пароль для пользователя ${user.username}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          username: user.username,
          role: user.role?.name 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      logger.info(`Успешный вход пользователя ${user.username}`);
      res.json({ token });
    } catch (error) {
      logger.error('Ошибка при входе:', error);
      res.status(400).json({ error: error.message });
    }
  },

  // Get all users (admin only)
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password_hash'] },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['name']
        }]
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { email, username, is_active, role } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Если указана роль, найдем ее id
      let role_id = user.role_id;
      if (role) {
        const roleRecord = await Role.findOne({ where: { name: role } });
        if (roleRecord) {
          role_id = roleRecord.id;
        } else {
          return res.status(400).json({ error: 'Role not found' });
        }
      }

      await user.update({
        email,
        username,
        is_active,
        role_id
      });

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        is_active: user.is_active,
        role_id: user.role_id
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Create user (admin only)
  async createUser(req, res) {
    try {
      const { email, password, username, role, isActive } = req.body;
      
      logger.info(`Creating user: ${JSON.stringify({ email, username, role })}`);
      
      // Find role ID
      let roleRecord;
      if (role) {
        // If role is specified, find it
        roleRecord = await Role.findOne({ where: { name: role } });
        if (!roleRecord) {
          logger.warn(`Role not found: ${role}`);
          return res.status(400).json({ error: `Role not found: ${role}` });
        }
      } else {
        // If role is not specified, use 'operator' as default
        roleRecord = await Role.findOne({ where: { name: 'operator' } });
        if (!roleRecord) {
          logger.error('Default operator role not found in the system');
          return res.status(400).json({ error: 'Default role not found' });
        }
      }
      
      // Check if user with the same email already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email },
            { username }
          ]
        }
      });
      
      if (existingUser) {
        logger.warn(`User already exists: ${existingUser.email}`);
        return res.status(400).json({ error: 'User with this email or username already exists' });
      }
      
      // Create the user
      const user = await User.create({
        email,
        password,
        username,
        role_id: roleRecord.id,
        isActive: isActive !== undefined ? isActive : true
      });
      
      // Remove password from response
      const userResponse = { ...user.toJSON() };
      delete userResponse.password;
      
      logger.info(`User created successfully: ${email}`);
      res.status(201).json(userResponse);
    } catch (error) {
      logger.error('Error creating user:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Проверим, не удаляет ли пользователь сам себя
      if (req.user.id === parseInt(id)) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
      }

      // Проверим, не является ли пользователь супер-администратором
      const userRole = await Role.findByPk(user.role_id);
      if (userRole && userRole.name === 'super_admin') {
        return res.status(403).json({ error: 'Super admin accounts cannot be deleted' });
      }

      await user.destroy();
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Смена пароля пользователя
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      logger.info(`Запрос на смену пароля для пользователя ID:${userId}`);

      // Проверяем наличие обязательных полей
      if (!currentPassword || !newPassword) {
        logger.warn('Отсутствуют обязательные поля для смены пароля');
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      // Проверяем минимальную длину пароля
      if (newPassword.length < 6) {
        logger.warn('Новый пароль слишком короткий');
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }

      // Находим пользователя
      const user = await User.findByPk(userId);
      if (!user) {
        logger.warn(`Пользователь ID:${userId} не найден`);
        return res.status(404).json({ error: 'User not found' });
      }

      // Проверяем текущий пароль
      const isPasswordValid = await user.validatePassword(currentPassword);
      if (!isPasswordValid) {
        logger.warn(`Неверный текущий пароль для пользователя ID:${userId}`);
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Обновляем пароль
      user.password = newPassword;
      await user.save();

      logger.info(`Пароль успешно изменен для пользователя ID:${userId}`);
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Ошибка при смене пароля:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  },

  // Получение профиля текущего пользователя
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      logger.info(`Запрос профиля пользователя ID:${userId}`);

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['name']
        }]
      });

      if (!user) {
        logger.warn(`Профиль пользователя ID:${userId} не найден`);
        return res.status(404).json({ error: 'User profile not found' });
      }

      logger.info(`Профиль пользователя ID:${userId} успешно получен`);
      res.json(user);
    } catch (error) {
      logger.error('Ошибка при получении профиля:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  },

  // Обновление профиля пользователя
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { email, username } = req.body;
      logger.info(`Запрос на обновление профиля ID:${userId}`);

      const user = await User.findByPk(userId);
      if (!user) {
        logger.warn(`Профиль пользователя ID:${userId} не найден`);
        return res.status(404).json({ error: 'User profile not found' });
      }

      // Обновляем только разрешенные поля
      if (email) user.email = email;
      if (username) user.username = username;

      await user.save();

      logger.info(`Профиль пользователя ID:${userId} успешно обновлен`);
      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      logger.error('Ошибка при обновлении профиля:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  }
};

module.exports = userController; 