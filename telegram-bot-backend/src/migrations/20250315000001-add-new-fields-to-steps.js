'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('steps', 'parse_mode', {
      type: Sequelize.ENUM('HTML', 'MarkdownV2', 'Markdown', 'None'),
      allowNull: true,
      defaultValue: 'None'
    });

    await queryInterface.addColumn('steps', 'media', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('steps', 'template', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('steps', 'button_style', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('steps', 'hide_step_counter', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('steps', 'parse_mode');
    await queryInterface.removeColumn('steps', 'media');
    await queryInterface.removeColumn('steps', 'template');
    await queryInterface.removeColumn('steps', 'button_style');
    await queryInterface.removeColumn('steps', 'hide_step_counter');
  }
}; 