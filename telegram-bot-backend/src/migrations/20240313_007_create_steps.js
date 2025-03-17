'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('steps', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      flow_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'flows',
          key: 'id'
        }
      },
      order_index: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      question: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      response_type: {
        type: Sequelize.ENUM('text', 'buttons', 'final'),
        allowNull: false,
        defaultValue: 'text'
      },
      is_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      options: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      config: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
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

    await queryInterface.addIndex('steps', ['flow_id']);
    await queryInterface.addIndex('steps', ['order_index']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('steps');
  }
}; 