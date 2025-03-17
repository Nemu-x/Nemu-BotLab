'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('Flows');
      
      if (!tableInfo.steps) {
        await queryInterface.addColumn('Flows', 'steps', {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: []
        });
        console.log('Колонка steps добавлена в таблицу Flows');
      } else {
        console.log('Колонка steps уже существует в таблице Flows');
      }
    } catch (error) {
      console.error('Ошибка при добавлении колонки steps:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Flows', 'steps');
      console.log('Колонка steps удалена из таблицы Flows');
    } catch (error) {
      console.error('Ошибка при удалении колонки steps:', error);
      throw error;
    }
  }
};
