'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'language', {
      type: Sequelize.STRING(10),
      allowNull: true,
      defaultValue: 'en'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('clients', 'language');
  }
};
