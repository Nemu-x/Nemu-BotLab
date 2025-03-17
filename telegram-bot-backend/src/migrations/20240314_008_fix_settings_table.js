const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Проверяем наличие таблицы settings
    const tables = await queryInterface.showAllTables();
    
    // Если таблица settings существует, удаляем ее
    if (tables.includes('settings')) {
      await queryInterface.dropTable('settings');
    }
    
    // Создаем таблицу settings заново
    await queryInterface.createTable('settings', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      botToken: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'botToken'
      },
      webhookUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'webhookUrl'
      },
      welcomeMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'welcomeMessage'
      },
      defaultResponse: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: 'Извините, я не знаю, как ответить на это сообщение. Используйте /help для просмотра доступных команд.',
        field: 'defaultResponse'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'createdAt'
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updatedAt'
      }
    });
    
    // Добавляем базовые настройки
    await queryInterface.bulkInsert('settings', [{
      botToken: '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ', // Замените на реальный токен
      webhookUrl: null,
      welcomeMessage: 'Привет! Я бот поддержки. Используйте /help для просмотра доступных команд.',
      defaultResponse: 'Извините, я не знаю, как ответить на это сообщение. Используйте /help для просмотра доступных команд.',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('settings');
  }
}; 