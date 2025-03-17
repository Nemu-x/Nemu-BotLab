'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Disable foreign key checks
      await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF;');

      // Backup existing data
      const clients = await queryInterface.sequelize.query(
        'SELECT * FROM clients',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      // Drop existing table
      await queryInterface.dropTable('clients');

      // Create new table with all required columns
      await queryInterface.createTable('clients', {
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
        assigned_to: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
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

      // Restore data
      if (clients.length > 0) {
        await queryInterface.bulkInsert('clients', clients);
      }

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