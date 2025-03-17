const bcrypt = require('bcryptjs');

async function testBcrypt() {
  try {
    console.log('Тестирование bcrypt...');
    
    // Создаем тестовый пароль
    const password = 'test123';
    console.log(`Пароль: ${password}`);
    
    // Хешируем пароль
    const hash = await bcrypt.hash(password, 10);
    console.log(`Хеш: ${hash}`);
    
    // Проверяем правильный пароль
    const validCheck = await bcrypt.compare(password, hash);
    console.log(`Проверка правильного пароля: ${validCheck ? 'УСПЕШНО' : 'НЕУДАЧНО'}`);
    
    // Проверяем неправильный пароль
    const invalidCheck = await bcrypt.compare('wrong123', hash);
    console.log(`Проверка неправильного пароля: ${invalidCheck ? 'УСПЕШНО' : 'НЕУДАЧНО'}`);
    
  } catch (error) {
    console.error('Ошибка при тестировании bcrypt:', error);
  }
}

testBcrypt(); 