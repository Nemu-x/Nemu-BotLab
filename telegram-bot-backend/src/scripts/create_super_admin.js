require('dotenv').config();
const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

async function createSuperAdmin() {
  try {
    console.log('Начинаю создание супер-администратора...');

    // Проверить подключение к базе данных
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');

    // Найти роль супер-администратора
    const superAdminRole = await Role.findOne({ where: { name: 'super_admin' } });
    
    if (!superAdminRole) {
      console.log('Роль супер-администратора не найдена. Создаю...');
      await Role.create({
        name: 'super_admin',
      });
      console.log('Роль супер-администратора успешно создана.');
    }
    
    // Проверить существование супер-администратора
    const existingSuperAdmin = await User.findOne({
      where: { username: 'superadmin' },
      include: [{ model: Role, where: { name: 'super_admin' } }]
    });

    if (existingSuperAdmin) {
      console.log('Супер-администратор уже существует, пропускаю создание.');
      return;
    }

    // Если роль найдена, создать супер-администратора
    const roleId = (await Role.findOne({ where: { name: 'super_admin' } })).id;
    const passwordHash = await bcrypt.hash('superadmin123', 10);

    await User.create({
      username: 'superadmin',
      email: 'superadmin@example.com',
      password_hash: passwordHash,
      role_id: roleId,
      is_active: true
    });

    console.log('Супер-администратор успешно создан!');
    console.log('Логин: superadmin');
    console.log('Пароль: superadmin123');
    
  } catch (error) {
    console.error('Ошибка при создании супер-администратора:', error);
  } finally {
    process.exit(0);
  }
}

// Запустить скрипт
createSuperAdmin(); 