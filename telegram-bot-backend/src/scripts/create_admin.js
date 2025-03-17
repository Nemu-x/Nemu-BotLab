require('dotenv').config();
const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

async function createAdmin() {
  try {
    console.log('Начинаю создание администратора...');

    // Проверить подключение к базе данных
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');

    // Найти роль администратора
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    
    if (!adminRole) {
      console.log('Роль администратора не найдена. Создаю...');
      await Role.create({
        name: 'admin',
      });
      console.log('Роль администратора успешно создана.');
    }
    
    // Проверить существование администратора
    const existingAdmin = await User.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('Администратор уже существует, пропускаю создание.');
      return;
    }

    // Если роль найдена, создать администратора
    const roleId = (await Role.findOne({ where: { name: 'admin' } })).id;
    const passwordHash = await bcrypt.hash('admin123', 10);

    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password_hash: passwordHash,
      role_id: roleId,
      is_active: true
    });

    console.log('Администратор успешно создан!');
    console.log('Логин: admin');
    console.log('Пароль: admin123');
    
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
  } finally {
    process.exit(0);
  }
}

// Запустить скрипт
createAdmin(); 