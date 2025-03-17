'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if admin user already exists
    const adminUser = await queryInterface.sequelize.query(
      'SELECT * FROM users WHERE username = ?',
      {
        replacements: ['admin'],
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    if (adminUser.length > 0) {
      console.log('Admin user already exists, skipping creation');
      return;
    }

    // Create admin role if it doesn't exist
    const adminRole = await queryInterface.sequelize.query(
      'SELECT * FROM roles WHERE name = ?',
      {
        replacements: ['admin'],
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    let roleId;
    if (adminRole.length === 0) {
      const [role] = await queryInterface.sequelize.query(
        'INSERT INTO roles (name, created_at, updated_at) VALUES (?, datetime("now"), datetime("now")) RETURNING id',
        {
          replacements: ['admin'],
          type: queryInterface.sequelize.QueryTypes.INSERT
        }
      );
      roleId = role[0].id;
    } else {
      roleId = adminRole[0].id;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin', 10);
    await queryInterface.bulkInsert('users', [{
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role_id: roleId,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { username: 'admin' });
  }
}; 