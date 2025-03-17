'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('clients', 'photo_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('clients', 'is_dialog_open', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('clients', 'photo_url');
    await queryInterface.removeColumn('clients', 'is_dialog_open');
  }
}; 