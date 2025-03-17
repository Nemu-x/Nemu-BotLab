'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Создаем ENUM тип для parse_mode, если его еще нет
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_steps_parse_mode" AS ENUM ('HTML', 'MarkdownV2', 'Markdown', 'None');
      `);
    } catch (error) {
      console.log('ENUM type already exists or using SQLite which does not support ENUM types');
    }

    // Добавляем колонки
    await queryInterface.addColumn('steps', 'parse_mode', {
      type: Sequelize.STRING, // В SQLite используем STRING вместо ENUM
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
