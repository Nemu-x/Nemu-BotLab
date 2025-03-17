const winston = require('winston');
const path = require('path');

// Определение форматов логов
const formats = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Создание логгера
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: formats,
  defaultMeta: { service: 'telegram-bot-api' },
  transports: [
    // Вывод всех уровней логов в консоль
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Запись логов уровня info и выше в файл
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log')
    })
  ]
});

// Если не в production среде, выводим логи в консоль в более читаемом формате
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger; 