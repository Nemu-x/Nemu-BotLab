'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверим, существует ли уже пользователь с ID 1
    const user = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE id = 1',
      {
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (user.length === 0) {
      console.log('Пользователь с ID 1 не найден. Flow не будет создан.');
      return;
    }

    // Добавляем тестовый flow
    await queryInterface.bulkInsert('flows', [{
      id: 1,
      name: 'Test Flow',
      description: 'Test flow for development',
      is_default: true,
      is_active: true,
      created_by: 1, // ID пользователя admin
      created_at: new Date(),
      updated_at: new Date(),
      steps: JSON.stringify([])
    }]);

    console.log('Тестовый flow успешно добавлен.');
  },

  async down(queryInterface, Sequelize) {
    // Удаляем тестовый flow
    await queryInterface.bulkDelete('flows', { id: 1 }, {});
  }
}; 