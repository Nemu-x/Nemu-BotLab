const bcrypt = require('bcrypt');
const { User, Role } = require('../models');
const sequelize = require('../config/database');

async function createAdminUser() {
  try {
    console.log('Подключаюсь к базе данных...');
    await sequelize.authenticate();
    console.log('Проверяю наличие ролей...');
    
    // Проверяем наличие ролей
    const rolesCount = await Role.count();
    
    if (rolesCount === 0) {
      console.log('Создаю базовые роли...');
      await Role.bulkCreate([
        { name: 'user' },
        { name: 'admin' },
        { name: 'super_admin' }
      ]);
      console.log('Роли созданы');
    } else {
      console.log(`Найдено ${rolesCount} ролей`);
    }
    
    // Получаем роль super_admin
    const superAdminRole = await Role.findOne({
      where: { name: 'super_admin' }
    });
    
    if (!superAdminRole) {
      throw new Error('Роль super_admin не найдена');
    }
    
    // Проверяем, существует ли уже admin пользователь
    const existingAdmin = await User.findOne({
      where: { username: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('Пользователь admin уже существует');
      return;
    }
    
    // Создаем admin пользователя
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: passwordHash,
      role_id: superAdminRole.id,
      role: 'super_admin',
      is_active: true
    });
    
    console.log('Администратор успешно создан');
    
    // Создаем базовые команды
    const Command = require('../models/Command');
    
    // Проверяем наличие команд
    const commandsCount = await Command.count();
    
    if (commandsCount === 0) {
      console.log('Создаю базовые команды...');
      await Command.bulkCreate([
        {
          command: '/start',
          response: 'Привет! Я бот поддержки. Используйте /help для просмотра доступных команд.',
          description: 'Начальное приветствие',
          type: 'slash',
          match_type: 'exact',
          is_active: true
        },
        {
          command: '/help',
          response: 'Доступные команды:\n/start - Начать разговор\n/help - Показать список команд',
          description: 'Справка по командам',
          type: 'slash',
          match_type: 'exact',
          is_active: true
        }
      ]);
      console.log('Базовые команды созданы');
    } else {
      console.log(`Найдено ${commandsCount} команд`);
    }
    
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createAdminUser(); 