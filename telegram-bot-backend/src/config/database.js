const { Sequelize } = require('sequelize');

// Получаем и нормализуем значение окружения
const env = (process.env.NODE_ENV || 'development').trim().toLowerCase();

// Конфигурация для разных окружений
const config = {
  development: {
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'telegram_bot',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

// Используем development как fallback, если конфигурация не найдена
const currentConfig = config[env] || config.development;

let sequelize;

// Инициализация Sequelize в зависимости от окружения
if (currentConfig.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: currentConfig.storage,
    logging: currentConfig.logging
  });
} else if (currentConfig.dialect === 'postgres') {
  sequelize = new Sequelize(
    currentConfig.database,
    currentConfig.username,
    currentConfig.password,
    {
      host: currentConfig.host,
      port: currentConfig.port,
      dialect: 'postgres',
      logging: currentConfig.logging,
      pool: currentConfig.pool
    }
  );
} else {
  throw new Error(`Unsupported dialect: ${currentConfig.dialect}`);
}

module.exports = config; 