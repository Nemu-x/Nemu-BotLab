'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Исправление структуры таблицы tickets, добавление недостающих колонок
    await queryInterface.renameTable('tickets', 'tickets_old');
    
    // Создаем новую таблицу со всеми нужными полями
    await queryInterface.createTable('tickets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
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
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'open'
      },
      priority: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'medium'
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    
    // Копируем данные из старой таблицы в новую
    await queryInterface.sequelize.query(`
      INSERT INTO tickets (id, title, description, client_id, status, priority, assigned_to, created_at, updated_at)
      SELECT id, title, description, client_id, status, priority, assigned_to, 
             CURRENT_TIMESTAMP as created_at, CURRENT_TIMESTAMP as updated_at
      FROM tickets_old
    `);
    
    // Удаляем старую таблицу
    await queryInterface.dropTable('tickets_old');
  },

  async down (queryInterface, Sequelize) {
    // Восстанавливаем таблицу к исходному состоянию
    await queryInterface.renameTable('tickets', 'tickets_temp');
    
    await queryInterface.createTable('tickets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
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
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'open'
      },
      priority: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'medium'
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    });
    
    await queryInterface.sequelize.query(`
      INSERT INTO tickets (id, title, description, client_id, status, priority, assigned_to)
      SELECT id, title, description, client_id, status, priority, assigned_to
      FROM tickets_temp
    `);
    
    await queryInterface.dropTable('tickets_temp');
  }
};
