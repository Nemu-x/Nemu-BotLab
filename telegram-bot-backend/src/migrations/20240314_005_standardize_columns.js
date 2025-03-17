const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 1. Обновление таблицы clients
      const clientsInfo = await queryInterface.describeTable('clients');
      
      // Проверяем наличие и при необходимости переименовываем camelCase поля в snake_case
      if (clientsInfo.telegramId && !clientsInfo.telegram_id) {
        await queryInterface.renameColumn('clients', 'telegramId', 'telegram_id');
      }
      
      if (clientsInfo.firstName && !clientsInfo.first_name) {
        await queryInterface.renameColumn('clients', 'firstName', 'first_name');
      }
      
      if (clientsInfo.lastName && !clientsInfo.last_name) {
        await queryInterface.renameColumn('clients', 'lastName', 'last_name');
      }
      
      if (clientsInfo.isBlocked && !clientsInfo.is_blocked) {
        await queryInterface.renameColumn('clients', 'isBlocked', 'is_blocked');
      }
      
      if (clientsInfo.lastMessageAt && !clientsInfo.last_message_at) {
        await queryInterface.renameColumn('clients', 'lastMessageAt', 'last_message_at');
      }
      
      if (clientsInfo.createdAt && !clientsInfo.created_at) {
        await queryInterface.renameColumn('clients', 'createdAt', 'created_at');
      }
      
      if (clientsInfo.updatedAt && !clientsInfo.updated_at) {
        await queryInterface.renameColumn('clients', 'updatedAt', 'updated_at');
      }
      
      // 2. Обновление таблицы messages
      const messagesInfo = await queryInterface.describeTable('messages');
      
      if (messagesInfo.clientId && !messagesInfo.client_id) {
        await queryInterface.renameColumn('messages', 'clientId', 'client_id');
      }
      
      if (messagesInfo.isFromBot && !messagesInfo.is_from_bot) {
        await queryInterface.renameColumn('messages', 'isFromBot', 'is_from_bot');
      }
      
      if (messagesInfo.isRead && !messagesInfo.is_read) {
        await queryInterface.renameColumn('messages', 'isRead', 'is_read');
      }
      
      if (messagesInfo.telegramMessageId && !messagesInfo.telegram_message_id) {
        await queryInterface.renameColumn('messages', 'telegramMessageId', 'telegram_message_id');
      }
      
      if (messagesInfo.createdAt && !messagesInfo.created_at) {
        await queryInterface.renameColumn('messages', 'createdAt', 'created_at');
      }
      
      if (messagesInfo.updatedAt && !messagesInfo.updated_at) {
        await queryInterface.renameColumn('messages', 'updatedAt', 'updated_at');
      }
      
      // 3. Обновление таблицы commands
      const commandsInfo = await queryInterface.describeTable('commands');
      
      if (commandsInfo.matchType && !commandsInfo.match_type) {
        await queryInterface.renameColumn('commands', 'matchType', 'match_type');
      }
      
      if (commandsInfo.isActive && !commandsInfo.is_active) {
        await queryInterface.renameColumn('commands', 'isActive', 'is_active');
      }
      
      if (commandsInfo.createdBy && !commandsInfo.created_by) {
        await queryInterface.renameColumn('commands', 'createdBy', 'created_by');
      }
      
      console.log('Migration completed: All columns standardized to snake_case format');
      return Promise.resolve();
    } catch (error) {
      console.error('Error during migration:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // 1. Возврат к camelCase для таблицы clients
      const clientsInfo = await queryInterface.describeTable('clients');
      
      if (!clientsInfo.telegramId && clientsInfo.telegram_id) {
        await queryInterface.renameColumn('clients', 'telegram_id', 'telegramId');
      }
      
      if (!clientsInfo.firstName && clientsInfo.first_name) {
        await queryInterface.renameColumn('clients', 'first_name', 'firstName');
      }
      
      if (!clientsInfo.lastName && clientsInfo.last_name) {
        await queryInterface.renameColumn('clients', 'last_name', 'lastName');
      }
      
      if (!clientsInfo.isBlocked && clientsInfo.is_blocked) {
        await queryInterface.renameColumn('clients', 'is_blocked', 'isBlocked');
      }
      
      if (!clientsInfo.lastMessageAt && clientsInfo.last_message_at) {
        await queryInterface.renameColumn('clients', 'last_message_at', 'lastMessageAt');
      }
      
      // 2. Возврат к camelCase для таблицы messages
      const messagesInfo = await queryInterface.describeTable('messages');
      
      if (!messagesInfo.clientId && messagesInfo.client_id) {
        await queryInterface.renameColumn('messages', 'client_id', 'clientId');
      }
      
      if (!messagesInfo.isFromBot && messagesInfo.is_from_bot) {
        await queryInterface.renameColumn('messages', 'is_from_bot', 'isFromBot');
      }
      
      if (!messagesInfo.isRead && messagesInfo.is_read) {
        await queryInterface.renameColumn('messages', 'is_read', 'isRead');
      }
      
      if (!messagesInfo.telegramMessageId && messagesInfo.telegram_message_id) {
        await queryInterface.renameColumn('messages', 'telegram_message_id', 'telegramMessageId');
      }
      
      // 3. Возврат к camelCase для таблицы commands
      const commandsInfo = await queryInterface.describeTable('commands');
      
      if (!commandsInfo.matchType && commandsInfo.match_type) {
        await queryInterface.renameColumn('commands', 'match_type', 'matchType');
      }
      
      if (!commandsInfo.isActive && commandsInfo.is_active) {
        await queryInterface.renameColumn('commands', 'is_active', 'isActive');
      }
      
      if (!commandsInfo.createdBy && commandsInfo.created_by) {
        await queryInterface.renameColumn('commands', 'created_by', 'createdBy');
      }
      
      console.log('Rollback completed: All columns returned to camelCase format');
      return Promise.resolve();
    } catch (error) {
      console.error('Error during rollback:', error);
      return Promise.reject(error);
    }
  }
}; 