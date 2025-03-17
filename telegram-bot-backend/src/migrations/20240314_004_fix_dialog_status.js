'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Disable foreign key checks
      await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF;');
      
      // Create new table without the duplicate column
      await queryInterface.createTable('clients_new', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        telegram_id: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        username: {
          type: Sequelize.STRING,
          allowNull: true
        },
        first_name: {
          type: Sequelize.STRING,
          allowNull: true
        },
        last_name: {
          type: Sequelize.STRING,
          allowNull: true
        },
        photo_url: {
          type: Sequelize.STRING,
          allowNull: true
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        is_blocked: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        is_dialog_open: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

      // Copy data from old table to new table
      await queryInterface.sequelize.query(
        'INSERT INTO clients_new SELECT id, telegram_id, username, first_name, last_name, photo_url, notes, is_blocked, is_dialog_open, created_at, updated_at FROM clients'
      );

      // Drop old table
      await queryInterface.dropTable('clients');

      // Rename new table to original name
      await queryInterface.renameTable('clients_new', 'clients');

      // Enable foreign key checks
      await queryInterface.sequelize.query('PRAGMA foreign_keys = ON;');
    } catch (error) {
      // Enable foreign key checks even if there was an error
      await queryInterface.sequelize.query('PRAGMA foreign_keys = ON;');
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No down migration needed as this is a fix
  }
}; 