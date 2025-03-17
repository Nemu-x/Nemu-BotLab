require('dotenv').config();
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

async function createAdminDirectly() {
  try {
    console.log('Начинаю создание администратора напрямую через SQL...');

    // Проверить подключение к базе данных
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');

    // Проверка существования таблицы roles
    const checkRolesTable = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='roles'",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('Таблицы в базе данных:', checkRolesTable);

    if (checkRolesTable.length === 0) {
      console.log('Таблица roles не найдена, создаю...');
      await sequelize.query(`
        CREATE TABLE roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Таблица roles создана.');
    } else {
      console.log('Таблица roles существует.');
    }

    // Проверка существования таблицы users
    const checkUsersTable = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
      { type: sequelize.QueryTypes.SELECT }
    );

    if (checkUsersTable.length === 0) {
      console.log('Таблица users не найдена, создаю...');
      await sequelize.query(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          role_id INTEGER,
          is_active BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (role_id) REFERENCES roles(id)
        )
      `);
      console.log('Таблица users создана.');
    } else {
      console.log('Таблица users существует.');
    }

    // Добавление ролей, если их еще нет
    const roles = await sequelize.query(
      "SELECT * FROM roles",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('Существующие роли:', roles);
    
    if (roles.length === 0) {
      console.log('Добавляю роли...');
      await sequelize.query(`
        INSERT INTO roles (name, created_at, updated_at) 
        VALUES 
        ('super_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('operator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      console.log('Роли добавлены.');
    } else {
      console.log('Роли уже существуют.');
    }

    // Получение ID роли admin
    const adminRole = await sequelize.query(
      "SELECT id FROM roles WHERE name = 'admin'",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('Роль admin:', adminRole);

    if (adminRole.length === 0) {
      throw new Error('Роль admin не найдена');
    }

    const adminRoleId = adminRole[0].id;

    // Проверка наличия пользователя admin
    const existingAdmin = await sequelize.query(
      "SELECT * FROM users WHERE username = 'admin'",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('Существующий пользователь admin:', existingAdmin);

    if (existingAdmin.length > 0) {
      console.log('Пользователь admin уже существует.');
    } else {
      console.log('Создаю пользователя admin...');
      
      // Хеширование пароля
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      // Добавление пользователя admin
      await sequelize.query(`
        INSERT INTO users (username, email, password_hash, role_id, is_active, created_at, updated_at)
        VALUES ('admin', 'admin@example.com', ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, {
        replacements: [passwordHash, adminRoleId],
        type: sequelize.QueryTypes.INSERT
      });
      
      console.log('Пользователь admin создан успешно!');
      console.log('Логин: admin');
      console.log('Пароль: admin123');
    }

    // Вывод всех пользователей
    const allUsers = await sequelize.query(
      "SELECT u.id, u.username, u.email, u.is_active, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('Все пользователи:');
    console.log(allUsers);
    
  } catch (error) {
    console.error('Ошибка при выполнении скрипта:', error);
  } finally {
    process.exit(0);
  }
}

createAdminDirectly(); 