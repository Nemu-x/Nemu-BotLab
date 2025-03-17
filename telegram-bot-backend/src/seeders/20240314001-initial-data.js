'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create roles if they don't exist
    const roles = [
      { name: 'admin', created_at: new Date(), updated_at: new Date() },
      { name: 'operator', created_at: new Date(), updated_at: new Date() },
      { name: 'user', created_at: new Date(), updated_at: new Date() }
    ];

    await queryInterface.bulkInsert('roles', roles, { ignoreDuplicates: true });

    // Create default settings
    const settings = [
      { key: 'botToken', value: '', created_at: new Date(), updated_at: new Date() },
      { key: 'welcomeMessage', value: 'Добро пожаловать!', created_at: new Date(), updated_at: new Date() },
      { key: 'autoReply', value: 'Спасибо за ваше сообщение. Оператор ответит вам в ближайшее время.', created_at: new Date(), updated_at: new Date() }
    ];

    await queryInterface.bulkInsert('settings', settings, { ignoreDuplicates: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('settings', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
}; 