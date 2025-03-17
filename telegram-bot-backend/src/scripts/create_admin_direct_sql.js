require('dotenv').config();
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

async function createAdminDirectSql() {
  try {
    console.log('Создание администратора напрямую через SQL...');
    
    // Подключаемся к базе данных
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');
    
    // Генерируем учетные данные
    const username = 'admintest';
    const password = 'admintest123';
    const email = 'admintest@example.com';
    
    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(`Хеш пароля: ${passwordHash}`);
    
    // Получаем ID роли admin
    const [adminRole] = await sequelize.query(
      "SELECT id FROM roles WHERE name = 'admin'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (!adminRole) {
      throw new Error('Роль admin не найдена');
    }
    
    console.log(`Роль admin найдена, ID: ${adminRole.id}`);
    
    // Проверяем, существует ли уже пользователь
    const [existingUser] = await sequelize.query(
      "SELECT * FROM users WHERE username = ?",
      { 
        replacements: [username],
        type: sequelize.QueryTypes.SELECT 
      }
    );
    
    if (existingUser) {
      console.log(`Пользователь ${username} уже существует, обновляем пароль...`);
      
      await sequelize.query(
        "UPDATE users SET password_hash = ? WHERE username = ?",
        {
          replacements: [passwordHash, username],
          type: sequelize.QueryTypes.UPDATE
        }
      );
      
      console.log('Пароль обновлен.');
    } else {
      console.log(`Создаем нового пользователя ${username}...`);
      
      // Добавляем пользователя через прямой SQL-запрос
      await sequelize.query(
        "INSERT INTO users (username, email, password_hash, role_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        {
          replacements: [username, email, passwordHash, adminRole.id],
          type: sequelize.QueryTypes.INSERT
        }
      );
      
      console.log('Пользователь успешно создан!');
    }
    
    // Проверяем, что пользователь создан
    const [newUser] = await sequelize.query(
      "SELECT id, username, email, role_id FROM users WHERE username = ?",
      {
        replacements: [username],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    console.log('\nИнформация о пользователе:');
    console.log(newUser);
    
    console.log('\nДанные для входа:');
    console.log(`Имя пользователя: ${username}`);
    console.log(`Пароль: ${password}`);
    console.log(`Email: ${email}`);
    
    // Проверяем хеш пароля напрямую
    const [storedHash] = await sequelize.query(
      "SELECT password_hash FROM users WHERE username = ?",
      {
        replacements: [username],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    console.log('\nПроверка пароля:');
    const isValid = await bcrypt.compare(password, storedHash.password_hash);
    console.log(`Результат: ${isValid ? 'УСПЕШНО' : 'НЕУДАЧНО'}`);
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    process.exit(0);
  }
}

createAdminDirectSql(); 