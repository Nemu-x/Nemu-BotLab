const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the table exists
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('settings')) {
      await queryInterface.createTable('settings', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        botToken: {
          type: DataTypes.STRING,
          allowNull: false
        },
        webhookUrl: {
          type: DataTypes.STRING,
          allowNull: true
        },
        welcomeMessage: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        defaultResponse: {
          type: DataTypes.TEXT,
          allowNull: true,
          defaultValue: 'Извините, я не знаю, как ответить на это сообщение. Используйте /help для просмотра доступных команд.'
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    } else {
      // If table exists, check and add new columns if needed
      const tableInfo = await queryInterface.describeTable('settings');
      
      if (!tableInfo.welcomeMessage) {
        await queryInterface.addColumn('settings', 'welcomeMessage', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      
      if (!tableInfo.defaultResponse) {
        await queryInterface.addColumn('settings', 'defaultResponse', {
          type: DataTypes.TEXT,
          allowNull: true,
          defaultValue: 'Извините, я не знаю, как ответить на это сообщение. Используйте /help для просмотра доступных команд.'
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('settings');
  }
}; 