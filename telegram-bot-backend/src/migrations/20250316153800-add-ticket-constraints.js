'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Проверяем, существует ли таблица tickets
    const tables = await queryInterface.showAllTables();
    const ticketsExists = tables.includes('tickets');
    
    if (!ticketsExists) {
      console.log('Table tickets does not exist, creating it');
      // Создаем таблицу tickets, если её нет
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
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
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
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
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
      
      console.log('Table tickets created successfully');
      return;
    }
    
    // Если таблица tickets существует, добавляем недостающие столбцы и ограничения
    console.log('Table tickets already exists, adding constraints if needed');
    
    // Добавляем внешние ключи
    try {
      // Проверяем, есть ли уже такое ограничение
      await queryInterface.addConstraint('tickets', {
        fields: ['client_id'],
        type: 'foreign key',
        name: 'tickets_client_id_fk',
        references: {
          table: 'clients',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      console.log('Added constraint tickets_client_id_fk');
    } catch (error) {
      console.log('Constraint tickets_client_id_fk already exists or could not be added:', error.message);
    }
    
    try {
      await queryInterface.addConstraint('tickets', {
        fields: ['assigned_to'],
        type: 'foreign key',
        name: 'tickets_assigned_to_fk',
        references: {
          table: 'users',
          field: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      console.log('Added constraint tickets_assigned_to_fk');
    } catch (error) {
      console.log('Constraint tickets_assigned_to_fk already exists or could not be added:', error.message);
    }
    
    // Проверяем наличие столбцов и добавляем/обновляем их при необходимости
    try {
      // Проверяем, есть ли столбец status
      await queryInterface.describeTable('tickets').then(tableDefinition => {
        if (!tableDefinition.status) {
          // Если столбца нет, добавляем его
          return queryInterface.addColumn('tickets', 'status', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'open'
          });
        } else {
          // Если столбец есть, обновляем его
          return queryInterface.changeColumn('tickets', 'status', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'open'
          });
        }
      });
      console.log('Added/updated status column');
    } catch (error) {
      console.log('Could not add/update status column:', error.message);
    }
    
    try {
      // Проверяем, есть ли столбец priority
      await queryInterface.describeTable('tickets').then(tableDefinition => {
        if (!tableDefinition.priority) {
          // Если столбца нет, добавляем его
          return queryInterface.addColumn('tickets', 'priority', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'medium'
          });
        } else {
          // Если столбец есть, обновляем его
          return queryInterface.changeColumn('tickets', 'priority', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'medium'
          });
        }
      });
      console.log('Added/updated priority column');
    } catch (error) {
      console.log('Could not add/update priority column:', error.message);
    }
  },

  async down (queryInterface, Sequelize) {
    // В down-миграции удаляем добавленные ограничения
    try {
      await queryInterface.removeConstraint('tickets', 'tickets_client_id_fk');
      await queryInterface.removeConstraint('tickets', 'tickets_assigned_to_fk');
    } catch (error) {
      console.log('Error removing constraints:', error.message);
    }
  }
}; 