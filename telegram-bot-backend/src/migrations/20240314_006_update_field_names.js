const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 1. Исправление таблицы commands
      const commandsInfo = await queryInterface.describeTable('commands');
      
      // Переименовываем question -> command, если нужно
      if (commandsInfo.question && !commandsInfo.command) {
        await queryInterface.renameColumn('commands', 'question', 'command');
      }
      
      // Переименовываем answer -> response, если нужно
      if (commandsInfo.answer && !commandsInfo.response) {
        await queryInterface.renameColumn('commands', 'answer', 'response');
      }
      
      // 2. Исправление таблицы messages
      const messagesInfo = await queryInterface.describeTable('messages');
      
      // Переименовываем content -> text, если нужно
      if (messagesInfo.content && !messagesInfo.text) {
        await queryInterface.renameColumn('messages', 'content', 'text');
      }
      
      // 3. Исправление таблицы users
      const usersInfo = await queryInterface.describeTable('users');
      
      // Переименовываем password_hash -> password, если нужно
      if (usersInfo.password_hash && !usersInfo.password) {
        await queryInterface.renameColumn('users', 'password_hash', 'password');
      }
      
      // Добавляем колонку role, если нужно
      if (usersInfo.role_id && !usersInfo.role) {
        await queryInterface.addColumn('users', 'role', {
          type: DataTypes.ENUM('admin', 'super_admin', 'user'),
          defaultValue: 'user',
          allowNull: false
        });
        
        // Копируем данные из role_id в role
        await queryInterface.sequelize.query(`
          UPDATE users 
          SET role = CASE 
            WHEN role_id = 1 THEN 'user'
            WHEN role_id = 2 THEN 'admin'
            WHEN role_id = 3 THEN 'super_admin'
            ELSE 'user'
          END
        `);
      }
      
      console.log('Migration completed: Updated field names to match models');
      return Promise.resolve();
    } catch (error) {
      console.error('Error during migration:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // 1. Отменяем изменения в таблице commands
      const commandsInfo = await queryInterface.describeTable('commands');
      
      // Возвращаем имя command -> question, если нужно
      if (commandsInfo.command && !commandsInfo.question) {
        await queryInterface.renameColumn('commands', 'command', 'question');
      }
      
      // Возвращаем имя response -> answer, если нужно
      if (commandsInfo.response && !commandsInfo.answer) {
        await queryInterface.renameColumn('commands', 'response', 'answer');
      }
      
      // 2. Отменяем изменения в таблице messages
      const messagesInfo = await queryInterface.describeTable('messages');
      
      // Возвращаем имя text -> content, если нужно
      if (messagesInfo.text && !messagesInfo.content) {
        await queryInterface.renameColumn('messages', 'text', 'content');
      }
      
      // 3. Отменяем изменения в таблице users
      const usersInfo = await queryInterface.describeTable('users');
      
      // Возвращаем имя password -> password_hash, если нужно
      if (usersInfo.password && !usersInfo.password_hash) {
        await queryInterface.renameColumn('users', 'password', 'password_hash');
      }
      
      // Удаляем колонку role, если она была добавлена
      if (usersInfo.role) {
        await queryInterface.removeColumn('users', 'role');
      }
      
      console.log('Rollback completed: Reverted field names to original state');
      return Promise.resolve();
    } catch (error) {
      console.error('Error during rollback:', error);
      return Promise.reject(error);
    }
  }
}; 