'use strict';

const { DataTypes } = require('sequelize');
const logger = require('../config/logger');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Проверяем наличие колонки nextStepId
      const tableInfo = await queryInterface.describeTable('steps');
      
      if (!tableInfo.next_step_id) {
        logger.info('Добавление колонки next_step_id в таблицу steps');
        await queryInterface.addColumn('steps', 'next_step_id', {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: null
        });
      } else {
        logger.info('Колонка next_step_id уже существует в таблице steps');
      }
      
      if (!tableInfo.is_final) {
        logger.info('Добавление колонки is_final в таблицу steps');
        await queryInterface.addColumn('steps', 'is_final', {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        });
      } else {
        logger.info('Колонка is_final уже существует в таблице steps');
      }
      
      // Обновляем ENUM для response_type, если нужно
      try {
        // Получаем текущие значения ENUM
        const result = await queryInterface.sequelize.query(
          "SELECT DISTINCT UNNEST(enum_range(NULL::steps_response_type_enum)) AS enum_value"
        );
        
        const currentValues = result[0].map(r => r.enum_value);
        const newValues = ['text', 'callback', 'url', 'nextStep', 'keyboard'];
        
        // Проверяем, нужно ли обновлять ENUM
        let needsUpdate = false;
        for (const val of newValues) {
          if (!currentValues.includes(val)) {
            needsUpdate = true;
            break;
          }
        }
        
        if (needsUpdate) {
          logger.info('Обновление ENUM для response_type');
          
          // Создаем временную колонку
          await queryInterface.addColumn('steps', 'response_type_new', {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'text'
          });
          
          // Копируем данные в новую колонку
          await queryInterface.sequelize.query(`
            UPDATE steps 
            SET response_type_new = response_type::text
          `);
          
          // Удаляем старую колонку
          await queryInterface.removeColumn('steps', 'response_type');
          
          // Создаем новый тип ENUM
          await queryInterface.sequelize.query(`
            CREATE TYPE steps_response_type_enum_new AS ENUM ('text', 'callback', 'url', 'nextStep', 'keyboard')
          `);
          
          // Добавляем новую колонку с обновленным ENUM
          await queryInterface.addColumn('steps', 'response_type', {
            type: DataTypes.ENUM('text', 'callback', 'url', 'nextStep', 'keyboard'),
            allowNull: false,
            defaultValue: 'text'
          });
          
          // Копируем данные обратно
          await queryInterface.sequelize.query(`
            UPDATE steps 
            SET response_type = response_type_new::steps_response_type_enum_new
          `);
          
          // Удаляем временную колонку
          await queryInterface.removeColumn('steps', 'response_type_new');
          
          logger.info('ENUM для response_type успешно обновлен');
        } else {
          logger.info('ENUM для response_type уже содержит все необходимые значения');
        }
      } catch (error) {
        logger.error('Ошибка при обновлении ENUM:', error);
      }
      
      logger.info('Миграция успешно выполнена');
      return Promise.resolve();
    } catch (error) {
      logger.error('Ошибка при выполнении миграции:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Проверяем наличие колонки nextStepId
      const tableInfo = await queryInterface.describeTable('steps');
      
      if (tableInfo.next_step_id) {
        logger.info('Удаление колонки next_step_id из таблицы steps');
        await queryInterface.removeColumn('steps', 'next_step_id');
      }
      
      if (tableInfo.is_final) {
        logger.info('Удаление колонки is_final из таблицы steps');
        await queryInterface.removeColumn('steps', 'is_final');
      }
      
      logger.info('Откат миграции успешно выполнен');
      return Promise.resolve();
    } catch (error) {
      logger.error('Ошибка при откате миграции:', error);
      return Promise.reject(error);
    }
  }
};
