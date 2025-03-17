const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sequelize = require('../config/database');

async function resetDatabase() {
  try {
    console.log('Начинаю сброс базы данных...');
    
    // Путь к файлу базы данных
    const dbPath = path.join(__dirname, '../../development.sqlite3');
    
    // Закрываем соединения с базой данных
    try {
      await sequelize.close();
      console.log('Соединение с базой данных закрыто');
    } catch (err) {
      console.log('Ошибка при закрытии соединения с базой данных:', err.message);
    }
    
    // Удаляем файл базы данных, если он существует
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('Файл базы данных удален');
    } else {
      console.log('Файл базы данных не найден, создаем новый');
    }
    
    // Создаем пустой файл базы данных
    fs.writeFileSync(dbPath, '');
    console.log('Создан новый пустой файл базы данных');
    
    // Запускаем миграции
    console.log('Запускаем миграции...');
    try {
      execSync('npx sequelize-cli db:migrate', { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
      console.log('Миграции успешно выполнены');
    } catch (err) {
      console.error('Ошибка при выполнении миграций:', err);
      process.exit(1);
    }
    
    // Создаем базовые роли
    console.log('Создаем базовые роли и пользователя admin...');
    try {
      execSync('node src/scripts/create-admin.js', { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
      console.log('Базовые роли и пользователь admin созданы');
    } catch (err) {
      console.error('Ошибка при создании ролей и пользователя admin:', err);
    }
    
    // Создаем базовые команды
    console.log('Создаем базовые команды...');
    try {
      execSync('node src/scripts/create-commands.js', { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
      console.log('Базовые команды созданы');
    } catch (err) {
      console.error('Ошибка при создании базовых команд:', err);
    }
    
    // Инициализируем настройки
    console.log('Инициализируем настройки...');
    try {
      execSync('node src/scripts/initialize-settings.js', { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
      console.log('Настройки инициализированы');
    } catch (err) {
      console.error('Ошибка при инициализации настроек:', err);
    }
    
    console.log('База данных успешно сброшена и инициализирована');
    process.exit(0);
  } catch (error) {
    console.error('Произошла ошибка при сбросе базы данных:', error);
    process.exit(1);
  }
}

// Запустить сброс базы данных
resetDatabase(); 