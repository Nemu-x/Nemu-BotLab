const sequelize = require('../config/database');
const { Settings } = require('../models');

async function initializeSettings() {
  try {
    console.log('Подключаюсь к базе данных...');
    await sequelize.authenticate();
    
    console.log('Создаю таблицу settings напрямую через SQL...');
    
    // Создаем таблицу settings
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bot_token TEXT NOT NULL,
        webhook_url TEXT,
        welcome_message TEXT,
        default_response TEXT DEFAULT 'Извините, я не знаю, как ответить на это сообщение. Используйте /help для просмотра доступных команд.',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Проверяем наличие настроек
    const existingSettings = await Settings.findOne();
    
    if (!existingSettings) {
      console.log('Добавляю базовые настройки...');
      
      // Подставьте здесь ваш токен бота
      const botToken = '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Нужно заменить на реальный токен
      
      await Settings.create({
        bot_token: botToken,
        webhook_url: null,
        welcome_message: 'Привет! Я бот поддержки. Используйте /help для просмотра доступных команд.',
        default_response: 'Извините, я не знаю, как ответить на это сообщение. Используйте /help для просмотра доступных команд.'
      });
      
      console.log('Базовые настройки добавлены.');
    } else {
      console.log('Настройки уже существуют.');
    }
    
  } catch (error) {
    console.error('Ошибка при инициализации настроек:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

initializeSettings(); 