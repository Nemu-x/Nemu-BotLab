const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Получаем описание таблицы
    const tableInfo = await queryInterface.describeTable('commands');
    
    // Проверяем, нужно ли добавить колонку is_active или переименовать существующую isActive
    if (!tableInfo.is_active && tableInfo.isActive) {
      // Создаем новую колонку is_active
      await queryInterface.addColumn('commands', 'is_active', {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
      
      // Копируем значения из isActive в is_active
      await queryInterface.sequelize.query(`
        UPDATE commands SET is_active = isActive;
      `);
    }
    
    // Для обратной совместимости оставляем обе колонки
    
    console.log('Migration completed: Fixed command fields');
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('commands');
    
    if (tableInfo.is_active) {
      await queryInterface.removeColumn('commands', 'is_active');
    }
  }
}; 