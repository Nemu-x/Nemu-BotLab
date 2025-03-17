'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица Flows
    try {
      await queryInterface.describeTable('Flows');
    } catch (error) {
      console.log('Таблица Flows не найдена:', error.message);
      return;
    }

    // Проверяем, существует ли колонка steps
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
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('Flows', 'steps');
      console.log('Колонка steps удалена из таблицы Flows');
    } catch (error) {
      console.error('Ошибка при удалении колонки steps:', error);
    }
  }
}; 