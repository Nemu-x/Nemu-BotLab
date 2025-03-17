'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Создаем ENUM тип для status, если его еще нет
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_dialogs_status" AS ENUM ('new', 'in_progress', 'closed');
      `);
    } catch (error) {
      console.log('ENUM type already exists or using SQLite which does not support ENUM types');
    }

    // Добавляем колонку status
    await queryInterface.addColumn('dialogs', 'status', {
      type: Sequelize.STRING, // В SQLite используем STRING вместо ENUM
      allowNull: false,
      defaultValue: 'new'
    });

    // Добавляем колонку resolution
    await queryInterface.addColumn('dialogs', 'resolution', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('dialogs', 'status');
    await queryInterface.removeColumn('dialogs', 'resolution');
  }
};
