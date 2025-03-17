const { Client } = require('../models');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

async function createTestClient() {
  try {
    await sequelize.authenticate();
    logger.info('База данных подключена');

    // Используем фиксированный telegramId
    const telegramId = 'test_user_123';
    
    // Проверяем, существует ли уже тестовый клиент
    const existingClient = await Client.findOne({
      where: { telegramId }
    });

    if (existingClient) {
      logger.info(`Клиент с ID ${telegramId} уже существует`);
      console.log('Клиент уже существует, обновляем данные');
      
      await existingClient.update({
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        notes: 'Обновленный тестовый пользователь ' + new Date().toISOString(),
        tags: ['test', 'example', 'updated'],
        category: 'test_updated',
        priority: 2,
        status: 'active',
        flowData: {
          lastCompletedFlow: null,
          answers: { test: 'updated' }
        }
      });
      
      logger.info(`Тестовый клиент обновлен с ID: ${existingClient.id}`);
      console.log('Тестовый клиент обновлен успешно!');
      console.log(existingClient.toJSON());
    } else {
      // Создаем тестового клиента
      const testClient = await Client.create({
        telegramId,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        notes: 'Тестовый пользователь для проверки функциональности',
        isBlocked: false,
        tags: ['test', 'example'],
        category: 'test',
        priority: 1,
        status: 'active',
        flowData: {
          lastCompletedFlow: null,
          answers: {}
        },
        isArchived: false
      });

      logger.info(`Тестовый клиент создан с ID: ${testClient.id}`);
      console.log('Тестовый клиент создан успешно!');
      console.log(testClient.toJSON());
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Ошибка при работе с тестовым клиентом:', error);
    console.error('Ошибка:', error.message);
    process.exit(1);
  }
}

createTestClient(); 