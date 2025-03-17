'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица flows
    try {
      await queryInterface.describeTable('flows');
    } catch (error) {
      console.log('Таблица flows не найдена:', error.message);
      return;
    }

    // Проверяем, существует ли колонка isDefault
    const tableInfo = await queryInterface.describeTable('flows');
    if (!tableInfo.isDefault) {
      await queryInterface.addColumn('flows', 'isDefault', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('Колонка isDefault добавлена в таблицу flows');
    } else {
      console.log('Колонка isDefault уже существует в таблице flows');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('flows', 'isDefault');
  }
}; 