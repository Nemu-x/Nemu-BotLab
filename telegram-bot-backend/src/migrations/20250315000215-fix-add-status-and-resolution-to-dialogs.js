'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Добавляем колонку status с значением по умолчанию 'new'
    await queryInterface.addColumn('dialogs', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'new'
    });

    // Добавляем колонку resolution, которая может быть NULL
    await queryInterface.addColumn('dialogs', 'resolution', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Создаем индекс на колонке status
    await queryInterface.addIndex('dialogs', ['status']);
  },

  async down (queryInterface, Sequelize) {
    // Удаляем индекс
    await queryInterface.removeIndex('dialogs', ['status']);
    
    // Удаляем колонки
    await queryInterface.removeColumn('dialogs', 'resolution');
    await queryInterface.removeColumn('dialogs', 'status');
  }
};
