require('dotenv').config();
const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

async function testLogin() {
  try {
    console.log('Тестирование входа пользователя...');

    // Проверить подключение к базе данных
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');

    // Ищем пользователя admin
    const user = await User.findOne({
      where: { username: 'admin' },
      include: [{ model: Role }]
    });

    if (!user) {
      console.log('Пользователь admin не найден!');
      return;
    }

    console.log('Найден пользователь:');
    console.log(`ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.Role ? user.Role.name : 'не назначена'}`);
    console.log(`Hash: ${user.password_hash}`);

    // Проверяем пароль
    console.log('\nПроверка нескольких паролей:');
    
    const passwords = ['admin123', 'admin', 'password', '123456'];
    for (const testPassword of passwords) {
      try {
        // Метод из модели
        const isValid = await user.validatePassword(testPassword);
        console.log(`Пароль "${testPassword}" через метод модели: ${isValid ? 'ВЕРНЫЙ' : 'неверный'}`);
        
        // Через bcrypt напрямую
        const isBcryptValid = await bcrypt.compare(testPassword, user.password_hash);
        console.log(`Пароль "${testPassword}" через bcrypt напрямую: ${isBcryptValid ? 'ВЕРНЫЙ' : 'неверный'}`);
      } catch (err) {
        console.error(`Ошибка при проверке пароля "${testPassword}":`, err);
      }
    }

    // Создадим новый тестовый пароль
    console.log('\nСоздаем новый тестовый пароль:');
    const newPassword = 'test123';
    const newHash = await bcrypt.hash(newPassword, 10);
    console.log(`Пароль: ${newPassword}`);
    console.log(`Хеш: ${newHash}`);
    
    // Проверим новый хеш
    const isNewValid = await bcrypt.compare(newPassword, newHash);
    console.log(`Проверка нового пароля: ${isNewValid ? 'Успешно' : 'Неудачно'}`);
    
  } catch (error) {
    console.error('Ошибка при тестировании входа:', error);
  } finally {
    process.exit(0);
  }
}

testLogin(); 