'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clients', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      telegram_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: true
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_blocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      priority: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'normal'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'active'
      },
      current_flow_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'flows',
          key: 'id'
        }
      },
      flow_data: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      is_archived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('clients', ['telegram_id']);
    await queryInterface.addIndex('clients', ['username']);
    await queryInterface.addIndex('clients', ['assigned_to']);
    await queryInterface.addIndex('clients', ['current_flow_id']);
    await queryInterface.addIndex('clients', ['is_blocked']);
    await queryInterface.addIndex('clients', ['is_archived']);
    await queryInterface.addIndex('clients', ['last_message_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('clients');
  }
}; 