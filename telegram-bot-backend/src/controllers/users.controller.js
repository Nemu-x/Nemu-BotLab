const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    let user;
    
    // Поиск пользователя по email или username
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (username) {
      user = await User.findOne({ where: { username } });
    } else {
      return res.status(400).json({ error: 'Email или username обязательны для входа' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Создаем JWT-токен
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        username: user.username, 
        role: user.role // Используем виртуальное свойство role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    return res.json({ token });
  } catch (error) {
    console.error('Ошибка при входе пользователя:', error);
    return res.status(500).json({ error: 'Ошибка при входе пользователя' });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Проверяем, существует ли пользователь с таким email или username
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          email ? { email } : {},
          { username }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email или username уже существует' });
    }
    
    // Создаем нового пользователя
    const user = await User.create({
      username,
      email,
      password: password, // Используем password вместо password_hash
      is_active: true
    });
    
    // Если указана роль, устанавливаем ее
    if (role) {
      user.role = role; // Используем сеттер виртуального свойства role
      await user.save();
    }
    
    return res.status(201).json({ message: 'Пользователь успешно зарегистрирован', userId: user.id });
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    return res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
  }
}; 