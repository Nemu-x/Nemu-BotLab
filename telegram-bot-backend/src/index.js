require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');
const botService = require('./services/bot.service');
const settingsRoutes = require('./routes/settingsRoutes');
const commandRoutes = require('./routes/commandRoutes');
const userRoutes = require('./routes/userRoutes');
const flowRoutes = require('./routes/flowRoutes');
const logger = require('./config/logger');
const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');

const app = express();
const PORT = process.env.PORT || 3001;

// Настройка миграций
const umzug = new Umzug({
  migrations: {
    glob: ['migrations/*.js', { 
      cwd: path.resolve(__dirname),
      ignore: ['migrations/index.js']
    }],
    resolve: ({ name, path, context }) => {
      const migration = require(path);
      return {
        name,
        up: async () => migration.up(context, Sequelize),
        down: async () => migration.down(context, Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Настройка CORS с явными разрешениями
const corsOptions = {
  origin: '*', // Разрешаем все источники для отладки
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin', 'X-Requested-With', 'Accept'],
  credentials: true, // Включаем для поддержки куки
  optionsSuccessStatus: 200, // Для старых браузеров
  preflightContinue: false
};

// Добавляем middleware для обработки OPTIONS запросов
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }
  next();
});

// Применяем CORS middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', routes);
// Эти маршруты уже включены через routes в строке выше
// app.use('/api/commands', commandRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/settings', settingsRoutes);
// app.use('/api/flows', flowRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Run migrations
    await umzug.up();
    logger.info('Migrations completed successfully.');

    // Sync database models
    await sequelize.sync();
    logger.info('Database models synchronized.');

    // Initialize bot service
    await botService.initialize();
    logger.info('Bot service initialized successfully.');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer(); 