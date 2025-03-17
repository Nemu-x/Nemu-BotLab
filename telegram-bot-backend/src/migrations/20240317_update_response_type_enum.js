'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Проверяем, существует ли таблица steps
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('steps')) {
        console.log('Таблица steps не существует, пропускаем миграцию');
        return;
      }

      // Получаем информацию о колонке response_type
      const tableInfo = await queryInterface.describeTable('steps');
      if (!tableInfo.response_type) {
        console.log('Колонка response_type не существует, пропускаем миграцию');
        return;
      }

      // Создаем временную колонку
      await queryInterface.addColumn('steps', 'response_type_new', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'text'
      });

      // Копируем данные из старой колонки в новую
      await queryInterface.sequelize.query(`
        UPDATE steps 
        SET response_type_new = response_type::text
      `);

      // Удаляем старую колонку
      await queryInterface.removeColumn('steps', 'response_type');

      // Создаем новый тип ENUM
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS steps_response_type_enum_new;
        CREATE TYPE steps_response_type_enum_new AS ENUM ('text', 'callback', 'url', 'nextStep', 'keyboard', 'final');
      `);

      // Добавляем новую колонку с обновленным ENUM
      await queryInterface.addColumn('steps', 'response_type', {
        type: Sequelize.ENUM('text', 'callback', 'url', 'nextStep', 'keyboard', 'final'),
        allowNull: false,
        defaultValue: 'text'
      });

      // Копируем данные из временной колонки в новую
      await queryInterface.sequelize.query(`
        UPDATE steps 
        SET response_type = response_type_new::steps_response_type_enum_new
      `);

      // Удаляем временную колонку
      await queryInterface.removeColumn('steps', 'response_type_new');

      console.log('Миграция успешно выполнена');
    } catch (error) {
      console.error('Ошибка при выполнении миграции:', error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Проверяем, существует ли таблица steps
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('steps')) {
        console.log('Таблица steps не существует, пропускаем откат миграции');
        return;
      }

      // Получаем информацию о колонке response_type
      const tableInfo = await queryInterface.describeTable('steps');
      if (!tableInfo.response_type) {
        console.log('Колонка response_type не существует, пропускаем откат миграции');
        return;
      }

      // Создаем временную колонку
      await queryInterface.addColumn('steps', 'response_type_new', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'text'
      });

      // Копируем данные из старой колонки в новую
      await queryInterface.sequelize.query(`
        UPDATE steps 
        SET response_type_new = response_type::text
      `);

      // Удаляем старую колонку
      await queryInterface.removeColumn('steps', 'response_type');

      // Создаем новый тип ENUM
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS steps_response_type_enum_old;
        CREATE TYPE steps_response_type_enum_old AS ENUM ('text', 'buttons', 'final');
      `);

      // Добавляем новую колонку с обновленным ENUM
      await queryInterface.addColumn('steps', 'response_type', {
        type: Sequelize.ENUM('text', 'buttons', 'final'),
        allowNull: false,
        defaultValue: 'text'
      });

      // Копируем данные из временной колонки в новую
      await queryInterface.sequelize.query(`
        UPDATE steps 
        SET response_type = 
          CASE 
            WHEN response_type_new IN ('callback', 'url', 'nextStep', 'keyboard') THEN 'buttons'::steps_response_type_enum_old
            ELSE response_type_new::steps_response_type_enum_old
          END
      `);

      // Удаляем временную колонку
      await queryInterface.removeColumn('steps', 'response_type_new');

      console.log('Откат миграции успешно выполнен');
    } catch (error) {
      console.error('Ошибка при откате миграции:', error);
    }
  }
}; 