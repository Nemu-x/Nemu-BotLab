'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Сначала удаляем старую таблицу
    await queryInterface.dropTable('messages');

    // Создаем новую таблицу с правильной структурой
    await queryInterface.createTable('messages', {
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
        }
      },
      message_content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_from_bot: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      telegram_message_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      is_direct_message: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      button_click_data: {
        type: Sequelize.JSON,
        allowNull: true
      },
      dialog_step_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      response_to_step_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      media_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      media_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      media_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      media_caption: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      media_size: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      media_filename: {
        type: Sequelize.STRING,
        allowNull: true
      },
      location_data: {
        type: Sequelize.JSON,
        allowNull: true
      },
      contact_data: {
        type: Sequelize.JSON,
        allowNull: true
      },
      flow_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'flows',
          key: 'id'
        }
      },
      flow_step_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'steps',
          key: 'id'
        }
      },
      responded_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
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

    // Создаем индексы
    await queryInterface.addIndex('messages', ['client_id']);
    await queryInterface.addIndex('messages', ['flow_id']);
    await queryInterface.addIndex('messages', ['flow_step_id']);
    await queryInterface.addIndex('messages', ['responded_by']);
    await queryInterface.addIndex('messages', ['is_read']);
    await queryInterface.addIndex('messages', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('messages');
  }
};
