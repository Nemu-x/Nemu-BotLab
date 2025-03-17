const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Получаем описание таблицы
    const tableInfo = await queryInterface.describeTable('clients');
    
    // Проверяем наличие полей created_at и updated_at
    if (!tableInfo.created_at && tableInfo.createdAt) {
      // Создаем колонку created_at
      await queryInterface.addColumn('clients', 'created_at', {
        type: DataTypes.DATE,
        allowNull: true
      });
      
      // Копируем значения из createdAt в created_at
      await queryInterface.sequelize.query(`
        UPDATE clients SET created_at = createdAt;
      `);
    }
    
    if (!tableInfo.updated_at && tableInfo.updatedAt) {
      // Создаем колонку updated_at
      await queryInterface.addColumn('clients', 'updated_at', {
        type: DataTypes.DATE,
        allowNull: true
      });
      
      // Копируем значения из updatedAt в updated_at
      await queryInterface.sequelize.query(`
        UPDATE clients SET updated_at = updatedAt;
      `);
    }
    
    // Обновляем пустые значения
    await queryInterface.sequelize.query(`
      UPDATE clients 
      SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE created_at IS NULL OR updated_at IS NULL;
    `);
    
    console.log('Migration completed: Fixed client fields');
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('clients');
    
    if (tableInfo.created_at) {
      await queryInterface.removeColumn('clients', 'created_at');
    }
    
    if (tableInfo.updated_at) {
      await queryInterface.removeColumn('clients', 'updated_at');
    }
  }
}; 