'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('clients');

    // Add banned_at column if it doesn't exist
    if (!tableInfo.banned_at) {
      await queryInterface.addColumn('clients', 'banned_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    // Add ban_reason column if it doesn't exist
    if (!tableInfo.ban_reason) {
      await queryInterface.addColumn('clients', 'ban_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    // Add banned_by column if it doesn't exist
    if (!tableInfo.banned_by) {
      await queryInterface.addColumn('clients', 'banned_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      });
    }

    // Add indexes
    await queryInterface.addIndex('clients', ['banned_at']);
    await queryInterface.addIndex('clients', ['banned_by']);
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('clients');

    // Remove indexes
    await queryInterface.removeIndex('clients', ['banned_at']);
    await queryInterface.removeIndex('clients', ['banned_by']);

    // Remove columns
    if (tableInfo.banned_by) {
      await queryInterface.removeColumn('clients', 'banned_by');
    }
    if (tableInfo.ban_reason) {
      await queryInterface.removeColumn('clients', 'ban_reason');
    }
    if (tableInfo.banned_at) {
      await queryInterface.removeColumn('clients', 'banned_at');
    }
  }
}; 