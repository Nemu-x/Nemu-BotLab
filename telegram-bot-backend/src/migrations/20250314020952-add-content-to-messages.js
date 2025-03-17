'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем, существует ли таблица messages
    try {
      const tableInfo = await queryInterface.describeTable('messages');
      
      // Добавляем поля, связанные с медиа
      if (!tableInfo.media_type) {
        await queryInterface.addColumn('messages', 'media_type', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
      
      if (!tableInfo.media_url) {
        await queryInterface.addColumn('messages', 'media_url', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
      
      if (!tableInfo.media_id) {
        await queryInterface.addColumn('messages', 'media_id', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
      
      if (!tableInfo.media_caption) {
        await queryInterface.addColumn('messages', 'media_caption', {
          type: Sequelize.TEXT,
          allowNull: true
        });
      }
      
      if (!tableInfo.media_size) {
        await queryInterface.addColumn('messages', 'media_size', {
          type: Sequelize.INTEGER,
          allowNull: true
        });
      }
      
      if (!tableInfo.media_filename) {
        await queryInterface.addColumn('messages', 'media_filename', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
      
      if (!tableInfo.location_data) {
        await queryInterface.addColumn('messages', 'location_data', {
          type: Sequelize.JSON,
          allowNull: true
        });
      }
      
      if (!tableInfo.contact_data) {
        await queryInterface.addColumn('messages', 'contact_data', {
          type: Sequelize.JSON,
          allowNull: true
        });
      }
      
      // Проверяем существование полей, связанных с текстом сообщения
      if (!tableInfo.text && tableInfo.content) {
        // Переименовываем content в text, так как в модели поле называется content, но в БД - text
        await queryInterface.renameColumn('messages', 'content', 'text');
      } else if (!tableInfo.text && !tableInfo.content) {
        // Если нет ни text, ни content, создаем text
        await queryInterface.addColumn('messages', 'text', {
          type: Sequelize.TEXT,
          allowNull: false,
          defaultValue: ''
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Удаляем добавленные поля
      await queryInterface.removeColumn('messages', 'media_type');
      await queryInterface.removeColumn('messages', 'media_url');
      await queryInterface.removeColumn('messages', 'media_id');
      await queryInterface.removeColumn('messages', 'media_caption');
      await queryInterface.removeColumn('messages', 'media_size');
      await queryInterface.removeColumn('messages', 'media_filename');
      await queryInterface.removeColumn('messages', 'location_data');
      await queryInterface.removeColumn('messages', 'contact_data');
      
      // Проверяем, существует ли поле text
      const tableInfo = await queryInterface.describeTable('messages');
      if (tableInfo.text && !tableInfo.content) {
        // Переименовываем text обратно в content
        await queryInterface.renameColumn('messages', 'text', 'content');
      }
    } catch (error) {
      console.error('Migration rollback error:', error);
    }
  }
};
