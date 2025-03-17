const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Найдем роль администратора
    const adminRole = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'admin'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!adminRole || adminRole.length === 0) {
      throw new Error('Admin role not found');
    }

    // Проверим, существует ли уже пользователь admin
    const existingAdmin = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE username = 'admin'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingAdmin && existingAdmin.length > 0) {
      console.log('Admin user already exists, skipping creation');
      return;
    }

    const adminRoleId = adminRole[0].id;
    const passwordHash = await bcrypt.hash('admin123', 10);

    await queryInterface.bulkInsert('users', [{
      username: 'admin',
      email: 'admin@example.com',
      password_hash: passwordHash,
      role_id: adminRoleId,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      username: 'admin'
    });
  }
}; 