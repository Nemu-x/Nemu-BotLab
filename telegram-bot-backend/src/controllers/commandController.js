const { Command } = require('../models');
const botService = require('../services/bot.service');
const logger = require('../config/logger');

const commandController = {
  // Get all commands
  async getAllCommands(req, res) {
    try {
      logger.info('Fetching all commands');
      const commands = await Command.findAll({
        order: [
          ['is_active', 'DESC'],
          ['type', 'ASC'],
          ['priority', 'DESC'],
          ['created_at', 'DESC']
        ]
      });
      logger.info(`Found ${commands.length} commands`);
      res.json(commands);
    } catch (error) {
      logger.error('Error fetching commands:', error);
      res.status(500).json({ error: 'Failed to fetch commands' });
    }
  },

  // Create new command
  async createCommand(req, res) {
    try {
      logger.info('Creating new command with body:', req.body);
      const { name, response, description, type, matchType, priority } = req.body;
      logger.info(`Creating new command: ${name}`);

      if (!name || !response) {
        logger.warn('Missing required fields for command creation', { name, response });
        return res.status(400).json({ error: 'Command name and response are required' });
      }

      // Validate and normalize command type
      let commandType = type || 'text';
      let commandMatchType = matchType || 'contains';

      // If it's a slash command, enforce exact matching
      if (name.startsWith('/')) {
        commandType = 'slash';
        commandMatchType = 'exact';
      }

      // For regex commands, validate the pattern
      if (commandType === 'regex') {
        try {
          new RegExp(name);
        } catch (e) {
          logger.warn('Invalid regex pattern:', name);
          return res.status(400).json({ error: 'Invalid regex pattern' });
        }
        commandMatchType = 'regex';
      }

      const newCommand = await Command.create({
        name: name,
        response: response,
        description: description || '',
        type: commandType,
        match_type: commandMatchType,
        priority: priority || 0,
        created_by: req.user ? req.user.id : null,
        is_active: true
      });

      logger.info(`Command created successfully: ${newCommand.id}`);
      await botService.updateCommands();
      res.status(201).json(newCommand);
    } catch (error) {
      logger.error('Error creating command:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({ error: 'Command with this name already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create command' });
      }
    }
  },

  // Update command
  async updateCommand(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      logger.info(`Updating command ${id}:`, updates);

      const command = await Command.findByPk(id);
      if (!command) {
        logger.warn(`Command ${id} not found`);
        return res.status(404).json({ error: 'Command not found' });
      }

      // Validate updates
      if (updates.type === 'regex' && updates.name) {
        try {
          new RegExp(updates.name);
        } catch (e) {
          logger.warn('Invalid regex pattern:', updates.name);
          return res.status(400).json({ error: 'Invalid regex pattern' });
        }
        updates.matchType = 'regex';
      }

      // If updating to a slash command
      if (updates.name && updates.name.startsWith('/')) {
        updates.type = 'slash';
        updates.matchType = 'exact';
      }

      await command.update(updates);
      logger.info(`Command ${id} updated successfully`);
      
      await botService.updateCommands();
      res.json(command);
    } catch (error) {
      logger.error(`Error updating command ${req.params.id}:`, error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({ error: 'Command with this name already exists' });
      } else {
        res.status(500).json({ error: 'Failed to update command' });
      }
    }
  },

  // Delete command
  async deleteCommand(req, res) {
    try {
      const { id } = req.params;
      logger.info(`Deleting command ${id}`);

      const command = await Command.findByPk(id);
      if (!command) {
        logger.warn(`Command ${id} not found`);
        return res.status(404).json({ error: 'Command not found' });
      }

      // Полностью удаляем команду из базы данных
      await command.destroy();
      logger.info(`Command ${id} deleted from database`);
      
      await botService.updateCommands();
      res.json({ message: 'Command deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting command ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete command' });
    }
  }
};

module.exports = commandController; 