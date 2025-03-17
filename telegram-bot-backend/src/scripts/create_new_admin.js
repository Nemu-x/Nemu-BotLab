require('dotenv').config();
const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

async function createNewAdmin() {
  try {
    console.log('Начинаю создание нового администратора...');

    // Проверить подключение к базе данных
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');

    // Проверяем существующие роли
    const roles = await Role.findAll();
    console.log('Существующие роли:');
    roles.forEach(role => {
      console.log(`ID: ${role.id}, Название: ${role.name}`);
    });

    // Находим роль super_admin
    const superAdminRole = await Role.findOne({ where: { name: 'super_admin' } });
    
    if (!superAdminRole) {
      console.log('Роль super_admin не найдена. Создаю...');
      const newRole = await Role.create({
        name: 'super_admin'
      });
      console.log(`Роль super_admin создана с ID: ${newRole.id}`);
      var roleId = newRole.id;
    } else {
      console.log(`Найдена роль super_admin с ID: ${superAdminRole.id}`);
      var roleId = superAdminRole.id;
    }

    // Генерируем новые учетные данные
    const newUsername = 'superadmin';
    const newPassword = 'superadmin123';
    const newEmail = 'superadmin@example.com';

    // Проверяем существование пользователя
    const existingUser = await User.findOne({ 
      where: { 
        username: newUsername 
      } 
    });

    if (existingUser) {
      console.log(`Пользователь ${newUsername} уже существует. Обновляю пароль...`);
      
      // Хешируем пароль
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Обновляем пароль
      await existingUser.update({
        password_hash: passwordHash,
        email: newEmail
      });
      
      console.log('Пароль пользователя обновлен!');
    } else {
      console.log(`Создаю нового пользователя ${newUsername}...`);
      
      // Хешируем пароль
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Создаем пользователя
      const newUser = await User.create({
        username: newUsername,
        email: newEmail,
        password_hash: passwordHash,
        role_id: roleId,
        is_active: true
      });
      
      console.log(`Пользователь ${newUsername} успешно создан с ID: ${newUser.id}`);
    }

    console.log('\nНовые учетные данные:');
    console.log(`Имя пользователя: ${newUsername}`);
    console.log(`Пароль: ${newPassword}`);
    console.log(`Email: ${newEmail}`);
    console.log('Роль: super_admin');

    // Проверяем пароль напрямую через bcrypt
    const user = await User.findOne({ where: { username: newUsername } });
    if (user) {
      const isValid = await bcrypt.compare(newPassword, user.password_hash);
      console.log(`\nПроверка пароля: ${isValid ? 'УСПЕШНО' : 'НЕУДАЧНО'}`);
    }
    
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
  } finally {
    process.exit(0);
  }
}

createNewAdmin(); 