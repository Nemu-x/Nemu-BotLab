'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, drop the existing table if it exists
    await queryInterface.dropTable('settings', { force: true });

    // Create the table with the correct structure
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique index on key
    await queryInterface.addIndex('settings', ['key'], {
      unique: true,
      name: 'settings_key_unique_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the unique index first
    await queryInterface.removeIndex('settings', 'settings_key_unique_idx');
    
    // Then drop the table
    await queryInterface.dropTable('settings');
  }
}; 