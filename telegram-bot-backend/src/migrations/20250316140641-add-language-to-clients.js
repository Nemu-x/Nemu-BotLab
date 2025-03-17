'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'language', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      after: 'last_message_at'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('clients', 'language');
  }
};
