module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      {
        name: 'super_admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'operator',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
}; 