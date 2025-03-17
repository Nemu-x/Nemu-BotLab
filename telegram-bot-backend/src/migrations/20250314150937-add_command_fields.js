'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Сначала удаляем старую таблицу
    await queryInterface.dropTable('commands');

    // Создаем таблицу заново с правильной структурой
    await queryInterface.createTable('commands', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      response: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('text', 'slash', 'regex'),
        defaultValue: 'text'
      },
      match_type: {
        type: Sequelize.ENUM('exact', 'contains', 'regex'),
        defaultValue: 'contains'
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      flow_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'flows',
          key: 'id'
        }
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Добавляем индексы
    await queryInterface.addIndex('commands', ['name']);
    await queryInterface.addIndex('commands', ['is_active']);
    await queryInterface.addIndex('commands', ['flow_id']);
    await queryInterface.addIndex('commands', ['created_by']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('commands');
  }
};
