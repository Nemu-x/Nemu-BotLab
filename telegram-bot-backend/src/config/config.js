const path = require('path');
require('dotenv').config();

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
    seederStorage: 'sequelize',
    migrationStorage: 'sequelize'
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    seederStorage: 'sequelize',
    migrationStorage: 'sequelize'
  },
  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'telegram_bot',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    logging: false,
    seederStorage: 'sequelize',
    migrationStorage: 'sequelize',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  port: process.env.PORT || 3001,
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info'
}; 