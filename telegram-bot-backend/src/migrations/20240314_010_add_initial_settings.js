'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add initial settings
    await queryInterface.bulkInsert('settings', [
      {
        key: 'botToken',
        value: process.env.TELEGRAM_BOT_TOKEN || '',
        description: 'Telegram Bot Token',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'webhookUrl',
        value: process.env.WEBHOOK_URL || '',
        description: 'Webhook URL for the bot',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'welcomeMessage',
        value: 'Привет! Я бот поддержки. Используйте /help для просмотра доступных команд.',
        description: 'Welcome message for new users',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'defaultResponseTime',
        value: '5',
        description: 'Default response time in minutes',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'notificationEmail',
        value: 'support@example.com',
        description: 'Email for notifications',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'autoRespond',
        value: 'true',
        description: 'Whether to auto-respond to messages',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'workingHours',
        value: JSON.stringify({ start: '09:00', end: '18:00' }),
        description: 'Working hours for the support',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'offlineMessage',
        value: 'Извините, мы сейчас не в сети. Мы ответим вам в рабочее время.',
        description: 'Message to show when offline',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'notifications',
        value: JSON.stringify({
          newChat: true,
          operatorAssigned: true,
          chatClosed: true
        }),
        description: 'Notification settings',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'defaultResponse',
        value: 'Извините, я не знаю, как ответить на это сообщение. Используйте /help для просмотра доступных команд.',
        description: 'Default response when no command matches',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('settings', null, {});
  }
}; 