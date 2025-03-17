require('dotenv').config();
const { User, Role } = require('../models');
const sequelize = require('../config/database');

async function listUsers() {
  try {
    console.log('Получаю список пользователей...');

    // Проверить подключение к базе данных
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');

    // Получить всех пользователей с их ролями
    const users = await User.findAll({
      include: [{ model: Role }]
    });

    if (users.length === 0) {
      console.log('Пользователи не найдены.');
      return;
    }

    console.log('Список пользователей:');
    console.log('--------------------------------');
    
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Имя пользователя: ${user.username}`);
      console.log(`Email: ${user.email || 'не указан'}`);
      console.log(`Роль: ${user.Role ? user.Role.name : 'не назначена'}`);
      console.log(`Активен: ${user.is_active ? 'Да' : 'Нет'}`);
      console.log('--------------------------------');
    });

    console.log(`Всего пользователей: ${users.length}`);
    
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
  } finally {
    process.exit(0);
  }
}

// Запустить скрипт
listUsers(); 