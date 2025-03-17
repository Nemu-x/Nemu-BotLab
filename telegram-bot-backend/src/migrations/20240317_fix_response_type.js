'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Проверяем, существует ли таблица steps
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('steps')) {
        console.log('Таблица steps не существует, пропускаем миграцию');
        return;
      }

      // Получаем информацию о колонках
      const tableInfo = await queryInterface.describeTable('steps');
      
      // Проверяем, существует ли колонка response_type_new
      if (tableInfo.response_type_new) {
        // Удаляем колонку response_type_new
        await queryInterface.removeColumn('steps', 'response_type_new');
        console.log('Удалена колонка response_type_new');
      }
      
      console.log('Миграция успешно выполнена');
    } catch (error) {
      console.error('Ошибка при выполнении миграции:', error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Ничего не делаем при откате
    return;
  }
}; 