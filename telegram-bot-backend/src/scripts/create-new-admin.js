const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

async function createNewAdmin() {
  try {
    console.log('Подключаюсь к базе данных...');
    await sequelize.authenticate();
    
    // Создаем нового админа напрямую через SQL
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await sequelize.query(`
      INSERT INTO users (username, email, password, role_id, role, is_active, created_at, updated_at)
      VALUES ('admintest', 'admintest@example.com', '${hashedPassword}', 3, 'super_admin', 1, datetime('now'), datetime('now'))
    `);
    
    console.log('Новый админ успешно создан:');
    console.log('Username: admintest');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Ошибка при создании нового админа:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createNewAdmin(); 