module.exports = {
  async up(queryInterface, Sequelize) {
    // Создаем таблицу диалогов
    await queryInterface.createTable('dialogs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false
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

    // Создаем таблицу шагов диалога
    await queryInterface.createTable('dialog_steps', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      dialog_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'dialogs',
          key: 'id'
        },
        allowNull: false
      },
      step_order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('message', 'buttons', 'input', 'conditional'),
        allowNull: false
      },
      message_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      validation_type: {
        type: Sequelize.ENUM('none', 'email', 'phone', 'text', 'number', 'button_only'),
        defaultValue: 'none'
      },
      validation_regex: {
        type: Sequelize.STRING,
        allowNull: true
      },
      error_message: {
        type: Sequelize.STRING,
        allowNull: true
      },
      next_step_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'dialog_steps',
          key: 'id'
        },
        allowNull: true
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

    // Создаем таблицу кнопок для шагов
    await queryInterface.createTable('dialog_step_buttons', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      step_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'dialog_steps',
          key: 'id'
        },
        allowNull: false
      },
      text: {
        type: Sequelize.STRING,
        allowNull: false
      },
      next_step_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'dialog_steps',
          key: 'id'
        },
        allowNull: true
      },
      action_type: {
        type: Sequelize.ENUM('next_step', 'finish', 'restart'),
        allowNull: false
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

    // Создаем таблицу ответов пользователей
    await queryInterface.createTable('dialog_user_responses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      dialog_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'dialogs',
          key: 'id'
        },
        allowNull: false
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      step_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'dialog_steps',
          key: 'id'
        },
        allowNull: false
      },
      response_type: {
        type: Sequelize.ENUM('button', 'text'),
        allowNull: false
      },
      response_value: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('dialog_user_responses');
    await queryInterface.dropTable('dialog_step_buttons');
    await queryInterface.dropTable('dialog_steps');
    await queryInterface.dropTable('dialogs');
  }
}; 