require('dotenv').config();
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
  try {
    console.log('Исправление учетной записи admin...');
    
    // Подключаемся к базе данных
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');
    
    // Генерируем новый пароль
    const password = 'admin123';
    
    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(`Новый хеш пароля: ${passwordHash}`);
    
    // Проверяем, существует ли пользователь admin
    const [existingUser] = await sequelize.query(
      "SELECT * FROM users WHERE username = ?",
      { 
        replacements: ['admin'],
        type: sequelize.QueryTypes.SELECT 
      }
    );
    
    if (existingUser) {
      console.log('Пользователь admin найден, обновляем пароль...');
      
      await sequelize.query(
        "UPDATE users SET password_hash = ? WHERE username = ?",
        {
          replacements: [passwordHash, 'admin'],
          type: sequelize.QueryTypes.UPDATE
        }
      );
      
      console.log('Пароль успешно обновлен.');
    } else {
      console.log('Пользователь admin не найден.');
    }
    
    // Проверяем хеш пароля напрямую
    const [storedHash] = await sequelize.query(
      "SELECT password_hash FROM users WHERE username = ?",
      {
        replacements: ['admin'],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (storedHash) {
      console.log('\nПроверка пароля:');
      const isValid = await bcrypt.compare(password, storedHash.password_hash);
      console.log(`Результат: ${isValid ? 'УСПЕШНО' : 'НЕУДАЧНО'}`);
      
      console.log('\nДанные для входа:');
      console.log('Имя пользователя: admin');
      console.log(`Пароль: ${password}`);
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    process.exit(0);
  }
}

fixAdmin(); 