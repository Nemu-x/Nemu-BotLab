'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('Flows');
      
      if (!tableInfo.isDefault) {
        await queryInterface.addColumn('Flows', 'isDefault', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
        console.log('Колонка isDefault добавлена в таблицу Flows');
      } else {
        console.log('Колонка isDefault уже существует в таблице Flows');
      }
    } catch (error) {
      console.error('Ошибка при добавлении колонки isDefault:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Flows', 'isDefault');
      console.log('Колонка isDefault удалена из таблицы Flows');
    } catch (error) {
      console.error('Ошибка при удалении колонки isDefault:', error);
      throw error;
    }
  }
};
