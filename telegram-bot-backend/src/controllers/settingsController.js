const { Settings } = require('../models');
const botService = require('../services/bot.service');
const logger = require('../config/logger');
const fetch = require('node-fetch');

const settingsController = {
  async getSettings(req, res) {
    try {
      logger.info('Fetching settings');
      const settings = await Settings.findAll();
      
      if (!settings || settings.length === 0) {
        logger.info('No settings found');
        return res.status(404).json({ error: 'Settings not found' });
      }

      // Convert settings array to object
      const settingsObject = settings.reduce((acc, setting) => {
        let value = setting.value;
        
        // Parse JSON values
        try {
          if (setting.key === 'workingHours' || setting.key === 'notifications') {
            value = JSON.parse(value);
          } else if (setting.key === 'autoRespond') {
            value = value === 'true';
          } else if (setting.key === 'defaultResponseTime') {
            value = parseInt(value, 10);
          }
        } catch (err) {
          logger.error(`Error parsing value for ${setting.key}:`, err);
        }

        acc[setting.key] = value;
        return acc;
      }, {});

      // Don't send the actual token to the frontend
      if (settingsObject.botToken) {
        settingsObject.botToken = '••••••••';
      }

      res.json(settingsObject);
    } catch (error) {
      logger.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  },

  async updateSettings(req, res) {
    try {
      logger.info('Updating settings');
      const updates = req.body;
      
      // Validate bot token if provided
      if (updates.botToken) {
        try {
          const response = await fetch(`https://api.telegram.org/bot${updates.botToken}/getMe`);
          const data = await response.json();
          
          if (!data.ok) {
            logger.error('Invalid bot token response:', data);
            return res.status(400).json({ error: 'Invalid bot token' });
          }
          logger.info('Bot token validated successfully');
        } catch (error) {
          logger.error('Error validating bot token:', error.message);
          return res.status(400).json({ error: 'Invalid bot token' });
        }
      }

      // Update each setting
      for (const [key, value] of Object.entries(updates)) {
        let stringValue = value;

        // Convert complex values to strings
        if (typeof value === 'object') {
          stringValue = JSON.stringify(value);
        } else if (typeof value === 'boolean') {
          stringValue = value.toString();
        }

        await Settings.upsert({
          key,
          value: stringValue,
          description: key === 'botToken' ? 'Telegram Bot Token' :
                      key === 'webhookUrl' ? 'Webhook URL for the bot' :
                      key === 'welcomeMessage' ? 'Welcome message for new users' :
                      key === 'defaultResponseTime' ? 'Default response time in minutes' :
                      key === 'notificationEmail' ? 'Email for notifications' :
                      key === 'autoRespond' ? 'Whether to auto-respond to messages' :
                      key === 'workingHours' ? 'Working hours for the support' :
                      key === 'offlineMessage' ? 'Message to show when offline' :
                      key === 'notifications' ? 'Notification settings' :
                      key === 'defaultResponse' ? 'Default response when no command matches' :
                      'Custom setting'
        });
      }

      // Reinitialize bot if token was updated
      if (updates.botToken) {
        try {
          await botService.initialize();
          logger.info('Bot reinitialized successfully');
        } catch (error) {
          logger.error('Error reinitializing bot:', error);
          // Continue anyway as settings were saved
        }
      }

      // Get updated settings
      const settings = await Settings.findAll();
      
      // Convert settings array to object
      const settingsObject = settings.reduce((acc, setting) => {
        let value = setting.value;
        
        // Parse JSON values
        try {
          if (setting.key === 'workingHours' || setting.key === 'notifications') {
            value = JSON.parse(value);
          } else if (setting.key === 'autoRespond') {
            value = value === 'true';
          } else if (setting.key === 'defaultResponseTime') {
            value = parseInt(value, 10);
          }
        } catch (err) {
          logger.error(`Error parsing value for ${setting.key}:`, err);
        }

        acc[setting.key] = value;
        return acc;
      }, {});

      // Don't send the actual token back
      if (settingsObject.botToken) {
        settingsObject.botToken = '••••••••';
      }

      res.json(settingsObject);
    } catch (error) {
      logger.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
};

module.exports = settingsController; 