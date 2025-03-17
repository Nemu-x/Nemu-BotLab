const sequelize = require('../config/database');

async function createCommands() {
  try {
    console.log('Подключаюсь к базе данных...');
    await sequelize.authenticate();
    
    // Создаем базовые команды напрямую через SQL
    await sequelize.query(`
      INSERT INTO commands (command, response, description, type, match_type, is_active, created_at, updated_at)
      VALUES 
        ('/start', 'Привет! Я бот поддержки. Используйте /help для просмотра доступных команд.', 'Начальное приветствие', 'slash', 'exact', 1, datetime('now'), datetime('now')),
        ('/help', 'Доступные команды:\n/start - Начать разговор\n/help - Показать список команд\n/test - Тестовая команда', 'Справка по командам', 'slash', 'exact', 1, datetime('now'), datetime('now')),
        ('/test', 'Это тестовая команда', 'Тестовая команда', 'slash', 'exact', 1, datetime('now'), datetime('now'))
    `);
    
    console.log('Базовые команды успешно созданы');
    
    // Проверяем созданные команды
    const [commands] = await sequelize.query('SELECT * FROM commands');
    console.log('Созданные команды:');
    commands.forEach(cmd => {
      console.log(`- ${cmd.command}: ${cmd.response}`);
    });
    
  } catch (error) {
    console.error('Ошибка при создании команд:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createCommands(); 