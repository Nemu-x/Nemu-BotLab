const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Получаем описание таблицы
    const tableInfo = await queryInterface.describeTable('commands');
    
    // Проверяем, нужно ли добавить колонку match_type или переименовать существующую matchType
    if (!tableInfo.match_type && tableInfo.matchType) {
      // Создаем новую колонку match_type
      await queryInterface.addColumn('commands', 'match_type', {
        type: DataTypes.ENUM('exact', 'contains', 'startsWith', 'regex'),
        defaultValue: 'contains'
      });
      
      // Копируем значения из matchType в match_type
      await queryInterface.sequelize.query(`
        UPDATE commands SET match_type = matchType;
      `);
    }
    
    // Для обратной совместимости оставляем обе колонки
    
    console.log('Migration completed: Fixed match_type field');
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('commands');
    
    if (tableInfo.match_type) {
      await queryInterface.removeColumn('commands', 'match_type');
    }
  }
}; 