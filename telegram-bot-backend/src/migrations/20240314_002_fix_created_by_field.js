const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Получаем описание таблицы
    const tableInfo = await queryInterface.describeTable('commands');
    
    // Проверяем, нужно ли добавить колонку created_by или переименовать существующую createdBy
    if (!tableInfo.created_by && tableInfo.createdBy) {
      // Создаем новую колонку created_by
      await queryInterface.addColumn('commands', 'created_by', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      });
      
      // Копируем значения из createdBy в created_by
      await queryInterface.sequelize.query(`
        UPDATE commands SET created_by = createdBy;
      `);
    }
    
    // Для обратной совместимости оставляем обе колонки
    
    console.log('Migration completed: Fixed created_by field');
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('commands');
    
    if (tableInfo.created_by) {
      await queryInterface.removeColumn('commands', 'created_by');
    }
  }
}; 