const sequelize = require('../config/database');
const { Settings } = require('../models');
const dotenv = require('dotenv');

// Загружаем переменные окружения из .env файла
dotenv.config();

async function updateBotToken() {
  try {
    console.log('Подключаюсь к базе данных...');
    await sequelize.authenticate();
    
    // Получаем токен из .env
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.error('Токен бота не найден в .env файле!');
      process.exit(1);
    }
    
    console.log('Обновляю токен бота в настройках...');
    
    // Ищем настройки
    let settings = await Settings.findOne();
    
    if (!settings) {
      console.log('Настройки не найдены, создаю новые...');
      settings = await Settings.create({
        botToken: botToken,
        welcomeMessage: 'Привет! Я бот поддержки. Используйте /help для просмотра доступных команд.',
        defaultResponse: 'Извините, я не знаю, как ответить на это сообщение. Используйте /help для просмотра доступных команд.'
      });
      console.log('Настройки созданы успешно.');
    } else {
      console.log('Обновляю существующие настройки...');
      await settings.update({
        botToken: botToken
      });
      console.log('Настройки обновлены успешно.');
    }
    
    // Проверяем обновление
    settings = await Settings.findOne();
    console.log('Токен бота в настройках:', settings.botToken.slice(0, 10) + '...');
    
  } catch (error) {
    console.error('Ошибка при обновлении токена бота:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Запускаем функцию обновления токена
updateBotToken(); 