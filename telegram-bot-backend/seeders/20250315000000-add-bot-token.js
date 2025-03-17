'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Settings', [
      {
        key: 'bot_token',
        value: '6123456789:AABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi', // Замените на реальный токен бота
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Settings', { key: 'bot_token' }, {});
  }
}; 