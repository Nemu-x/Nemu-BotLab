'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли колонка assigned_to
    const tableInfo = await queryInterface.describeTable('clients');
    if (!tableInfo.assigned_to) {
      await queryInterface.addColumn('clients', 'assigned_to', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('Колонка assigned_to добавлена в таблицу clients');
    } else {
      console.log('Колонка assigned_to уже существует в таблице clients');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('clients', 'assigned_to');
  }
}; 