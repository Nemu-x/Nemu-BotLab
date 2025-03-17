'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Disable foreign key checks
      await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF;');

      // Get the current table structure
      const tableInfo = await queryInterface.describeTable('users');
      
      // If the table has a role column, we need to handle the migration differently
      if (tableInfo.role) {
        // Create new table with correct column names
        await queryInterface.createTable('users_new', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          username: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          },
          email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          },
          password: {
            type: Sequelize.STRING,
            allowNull: false
          },
          first_name: {
            type: Sequelize.STRING,
            allowNull: true
          },
          last_name: {
            type: Sequelize.STRING,
            allowNull: true
          },
          role_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'roles',
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

        // Copy data from old table to new table, converting role to role_id
        await queryInterface.sequelize.query(`
          INSERT INTO users_new (
            id, username, email, password, first_name, last_name, role_id, 
            created_at, updated_at
          )
          SELECT 
            id, username, email, password, first_name, last_name, 
            CASE role 
              WHEN 'admin' THEN 1 
              WHEN 'operator' THEN 2 
              ELSE 3 
            END as role_id,
            created_at, updated_at
          FROM users
        `);

        // Drop old table
        await queryInterface.dropTable('users');

        // Rename new table to original name
        await queryInterface.renameTable('users_new', 'users');
      } else {
        // Just rename password_hash to password if needed
        if (tableInfo.password_hash) {
          await queryInterface.renameColumn('users', 'password_hash', 'password');
        }
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