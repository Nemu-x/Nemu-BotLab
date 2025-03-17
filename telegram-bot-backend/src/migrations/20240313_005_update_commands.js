const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('commands');

    // Add type column if it doesn't exist
    if (!tableInfo.type) {
      await queryInterface.addColumn('commands', 'type', {
        type: DataTypes.ENUM('slash', 'text', 'regex'),
        defaultValue: 'text'
      });
    }

    // Add description column if it doesn't exist
    if (!tableInfo.description) {
      await queryInterface.addColumn('commands', 'description', {
        type: DataTypes.STRING,
        allowNull: true
      });
    }

    // Add priority column if it doesn't exist
    if (!tableInfo.priority) {
      await queryInterface.addColumn('commands', 'priority', {
        type: DataTypes.INTEGER,
        defaultValue: 0
      });
    }

    // Add matchType column if it doesn't exist
    if (!tableInfo.matchType) {
      await queryInterface.addColumn('commands', 'matchType', {
        type: DataTypes.ENUM('exact', 'contains', 'startsWith', 'regex'),
        defaultValue: 'contains'
      });
    }

    // Update existing slash commands
    await queryInterface.sequelize.query(`
      UPDATE commands 
      SET type = 'slash', "matchType" = 'exact' 
      WHERE name LIKE '/%'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('commands');

    if (tableInfo.matchType) {
      await queryInterface.removeColumn('commands', 'matchType');
    }
    if (tableInfo.priority) {
      await queryInterface.removeColumn('commands', 'priority');
    }
    if (tableInfo.description) {
      await queryInterface.removeColumn('commands', 'description');
    }
    if (tableInfo.type) {
      await queryInterface.removeColumn('commands', 'type');
    }
  }
}; 