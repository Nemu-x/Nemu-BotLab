'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Проверяем, существует ли таблица flow_responses
    const tables = await queryInterface.showAllTables();
    if (tables.includes('flow_responses')) {
      console.log('Таблица flow_responses уже существует, пропускаем создание');
      return;
    }
    
    await queryInterface.createTable('flow_responses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      flow_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'flows',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      responses: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Проверяем наличие индексов и добавляем их только при необходимости
    try {
      await queryInterface.addIndex('flow_responses', ['client_id']);
    } catch (error) {
      console.log('Индекс flow_responses_client_id уже существует');
    }
    
    try {
      await queryInterface.addIndex('flow_responses', ['flow_id']);
    } catch (error) {
      console.log('Индекс flow_responses_flow_id уже существует');
    }
    
    try {
      await queryInterface.addIndex('flow_responses', ['completed']);
    } catch (error) {
      console.log('Индекс flow_responses_completed уже существует');
    }
    
    try {
      await queryInterface.addIndex('flow_responses', ['completed_at']);
    } catch (error) {
      console.log('Индекс flow_responses_completed_at уже существует');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('flow_responses');
  }
}; 