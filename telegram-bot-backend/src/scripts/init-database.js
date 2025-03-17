const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function initDatabase() {
  try {
    console.log('Запуск миграций...');
    const migrateResult = await execPromise('npx sequelize-cli db:migrate');
    console.log('Результат миграций:', migrateResult.stdout);
    
    // Создаем суперадмина вручную через SQL
    const sequelize = require('../config/database');
    
    console.log('Инициализация базы данных завершена успешно!');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    process.exit(1);
  }
}

// Запускаем функцию инициализации базы данных
initDatabase(); 