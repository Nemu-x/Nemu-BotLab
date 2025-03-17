const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('commands');

    // Add isActive column if it doesn't exist
    if (!tableInfo.isActive) {
      await queryInterface.addColumn('commands', 'isActive', {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }

    // Add createdBy column if it doesn't exist
    if (!tableInfo.createdBy) {
      await queryInterface.addColumn('commands', 'createdBy', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('commands');

    if (tableInfo.isActive) {
      await queryInterface.removeColumn('commands', 'isActive');
    }
    if (tableInfo.createdBy) {
      await queryInterface.removeColumn('commands', 'createdBy');
    }
  }
}; 