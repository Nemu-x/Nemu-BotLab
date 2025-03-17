const { Client, Message, User, Flow } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const botService = require('../services/bot.service');

const clientController = {
  // Get all clients with their last message
  async getAllClients(req, res) {
    try {
      logger.info('Fetching all clients');
      
      // Добавляем подробное логирование
      logger.info('User requesting clients:', req.user?.id);
      
      const clients = await Client.findAll({
        include: [
          {
            model: Message,
            as: 'messages',
            attributes: ['message_content', 'created_at', 'is_from_bot'],
            limit: 1,
            order: [['created_at', 'DESC']],
            required: false
          },
          {
            model: User,
            as: 'assignedOperator',
            attributes: ['id', 'username', 'email'],
            required: false
          },
          {
            model: Flow,
            as: 'currentFlow',
            attributes: ['id', 'name', 'description'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      logger.info(`Found ${clients.length} clients`);
      
      // Добавляем подробное логирование
      if (clients.length === 0) {
        logger.warn('No clients found in database');
      } else {
        logger.info(`First client ID: ${clients[0]?.id}, username: ${clients[0]?.username}`);
      }
      
      // Преобразуем snake_case в camelCase для фронтенда
      const formattedClients = clients.map(client => {
        const clientData = client.toJSON();
        return {
          ...clientData,
          firstName: clientData.first_name,
          lastName: clientData.last_name,
          telegramId: clientData.telegram_id,
          isBlocked: clientData.is_blocked,
          isDialogOpen: clientData.is_dialog_open,
          lastMessageAt: clientData.last_message_at,
          assignedTo: clientData.assigned_to,
          currentFlowId: clientData.current_flow_id,
          flowData: clientData.flow_data,
          isArchived: clientData.is_archived,
          createdAt: clientData.created_at,
          updatedAt: clientData.updated_at
        };
      });
      
      res.json(formattedClients);
    } catch (error) {
      logger.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
    }
  },

  // Get client by ID
  async getClientById(req, res) {
    try {
      const { id } = req.params;
      const client = await Client.findByPk(id, {
        include: [
          {
            model: Message,
            as: 'messages',
            attributes: ['message_content', 'created_at', 'is_from_bot'],
            order: [['created_at', 'DESC']]
          },
          {
            model: User,
            as: 'assignedOperator',
            attributes: ['id', 'username', 'email'],
            required: false
          },
          {
            model: Flow,
            as: 'currentFlow',
            attributes: ['id', 'name', 'description'],
            required: false
          }
        ]
      });

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Преобразуем snake_case в camelCase для фронтенда
      const clientData = client.toJSON();
      const formattedClient = {
        ...clientData,
        firstName: clientData.first_name,
        lastName: clientData.last_name,
        telegramId: clientData.telegram_id,
        isBlocked: clientData.is_blocked,
        isDialogOpen: clientData.is_dialog_open,
        lastMessageAt: clientData.last_message_at,
        assignedTo: clientData.assigned_to,
        currentFlowId: clientData.current_flow_id,
        flowData: clientData.flow_data,
        isArchived: clientData.is_archived,
        createdAt: clientData.created_at,
        updatedAt: clientData.updated_at
      };

      res.json(formattedClient);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update client notes
  async updateNotes(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      logger.info(`Updating notes for client ${id}`);
      const client = await Client.findByPk(id);
      
      if (!client) {
        logger.warn(`Client ${id} not found`);
        return res.status(404).json({ error: 'Client not found' });
      }

      await client.update({ notes });
      logger.info(`Notes updated for client ${id}`);
      res.json(client);
    } catch (error) {
      logger.error(`Error updating notes for client ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update notes' });
    }
  },

  // Toggle client block status
  async toggleBlock(req, res) {
    try {
      const { id } = req.params;
      const { isBlocked, banReason } = req.body;
      
      logger.info(`Toggling block status for client ${id} to ${isBlocked}`);
      const client = await Client.findByPk(id);
      
      if (!client) {
        logger.warn(`Client ${id} not found`);
        return res.status(404).json({ error: 'Client not found' });
      }

      // Обновляем данные блокировки
      const updateData = {
        is_blocked: isBlocked
      };
      
      // Добавляем причину блокировки и время, если клиент блокируется
      if (isBlocked) {
        updateData.ban_reason = banReason || '';
        updateData.banned_at = new Date();
        updateData.banned_by = req.user ? req.user.id : null;
      } else {
        // Если разблокируем, очищаем информацию о блокировке
        updateData.ban_reason = null;
        updateData.banned_at = null;
        updateData.banned_by = null;
      }

      await client.update(updateData);
      
      // Отправляем уведомление пользователю в Telegram
      try {
        if (isBlocked) {
          const message = `Ваш аккаунт был заблокирован${banReason ? `. Причина: ${banReason}` : '.'}`;
          await botService.sendMessage(client.telegram_id, message);
        } else {
          const message = 'Ваш аккаунт был разблокирован. Теперь вы снова можете общаться с ботом.';
          await botService.sendMessage(client.telegram_id, message);
        }
      } catch (err) {
        logger.error(`Failed to send block notification to client ${id}:`, err);
        // Продолжаем выполнение, даже если не удалось отправить сообщение
      }
      
      logger.info(`Block status updated for client ${id}`);
      res.json({
        success: true,
        client: {
          id: client.id,
          is_blocked: isBlocked,
          ban_reason: updateData.ban_reason,
          banned_at: updateData.banned_at,
          banned_by: updateData.banned_by
        }
      });
    } catch (error) {
      logger.error(`Error updating block status for client ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update block status' });
    }
  },

  // Search clients
  async searchClients(req, res) {
    try {
      const { query } = req.query;
      logger.info(`Searching clients with query: ${query}`);

      const clients = await Client.findAll({
        where: {
          [Op.or]: [
            { username: { [Op.like]: `%${query}%` } },
            { first_name: { [Op.like]: `%${query}%` } },
            { last_name: { [Op.like]: `%${query}%` } }
          ]
        },
        include: [{
          model: Message,
          as: 'lastMessage',
          attributes: ['message_content', 'created_at', 'is_from_bot'],
          required: false
        }],
        order: [[{ model: Message, as: 'lastMessage' }, 'created_at', 'DESC']]
      });

      logger.info(`Found ${clients.length} clients matching query`);
      res.json(clients);
    } catch (error) {
      logger.error('Error searching clients:', error);
      res.status(500).json({ error: 'Failed to search clients' });
    }
  },

  // Toggle dialog status
  async toggleDialogStatus(req, res) {
    try {
      const { id } = req.params;
      const { isDialogOpen } = req.body;

      const client = await Client.findByPk(id);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Обновляем статус диалога
      await client.update({ 
        is_dialog_open: isDialogOpen 
      });

      // Если диалог открывается, отправляем уведомление клиенту
      if (isDialogOpen) {
        const message = 'Оператор открыл диалог. Теперь вы можете продолжить общение.';
        await botService.sendMessage(client.telegram_id, message);
      }
      
      logger.info(`Dialog status updated for client ${id} to ${isDialogOpen}`);
      res.json({ success: true, isDialogOpen });
    } catch (error) {
      logger.error('Error toggling dialog status:', error);
      res.status(500).json({ error: 'Failed to toggle dialog status' });
    }
  },

  // Обновить язык клиента
  async updateClientLanguage(req, res) {
    try {
      const { id } = req.params;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ error: 'Language is required' });
      }
      
      const client = await Client.findByPk(id);
      
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      await client.update({ language });
      
      res.json(client);
    } catch (error) {
      logger.error(`Error updating client language:`, error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // Получить список клиентов по языку
  async getClientsByLanguage(req, res) {
    try {
      const { language } = req.params;
      
      const clients = await Client.findAll({
        where: { language },
        include: [
          {
            model: User,
            as: 'assignedOperator',
            attributes: ['id', 'username', 'email']
          }
        ]
      });
      
      res.json(clients);
    } catch (error) {
      logger.error(`Error getting clients by language:`, error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // Отправить массовое сообщение клиентам по языку
  async sendBulkMessageByLanguage(req, res) {
    try {
      const { language } = req.params;
      const { message, options } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      const result = await botService.sendBulkMessageByLanguage(language, message, options);
      
      res.json(result);
    } catch (error) {
      logger.error(`Error sending bulk message by language:`, error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // Отправить массовое приглашение на поток клиентам по языку
  async sendBulkFlowByLanguage(req, res) {
    try {
      const { language } = req.params;
      const { flowId } = req.body;
      
      if (!flowId) {
        return res.status(400).json({ error: 'Flow ID is required' });
      }
      
      const result = await botService.sendBulkFlowByLanguage(language, flowId);
      
      return res.status(200).json({ 
        message: `Flow invitation sent to ${result.sentCount} clients with language ${language}`,
        sentCount: result.sentCount,
        errorCount: result.errorCount
      });
    } catch (error) {
      logger.error('Error sending bulk flow by language:', error);
      return res.status(500).json({ error: 'Failed to send bulk flow invitation' });
    }
  },

  // Отправить массовое сообщение всем клиентам
  async sendBulkMessage(req, res) {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      const clients = await Client.findAll({
        where: {
          is_blocked: false
        }
      });
      
      let sentCount = 0;
      let errorCount = 0;
      
      for (const client of clients) {
        try {
          await botService.sendMessage(client.telegram_id, message);
          sentCount++;
        } catch (error) {
          logger.error(`Error sending message to client ${client.id}:`, error);
          errorCount++;
        }
      }
      
      return res.status(200).json({ 
        message: `Message sent to ${sentCount} clients`,
        sentCount,
        errorCount
      });
    } catch (error) {
      logger.error('Error sending bulk message:', error);
      return res.status(500).json({ error: 'Failed to send bulk message' });
    }
  },

  // Отправить массовое приглашение на поток всем клиентам
  async sendBulkFlow(req, res) {
    try {
      const { flowId } = req.body;
      
      if (!flowId) {
        return res.status(400).json({ error: 'Flow ID is required' });
      }
      
      const clients = await Client.findAll({
        where: {
          is_blocked: false
        }
      });
      
      let sentCount = 0;
      let errorCount = 0;
      
      for (const client of clients) {
        try {
          await botService.sendFlowInvitation(client.telegram_id, flowId);
          sentCount++;
        } catch (error) {
          logger.error(`Error sending flow invitation to client ${client.id}:`, error);
          errorCount++;
        }
      }
      
      return res.status(200).json({ 
        message: `Flow invitation sent to ${sentCount} clients`,
        sentCount,
        errorCount
      });
    } catch (error) {
      logger.error('Error sending bulk flow invitation:', error);
      return res.status(500).json({ error: 'Failed to send bulk flow invitation' });
    }
  }
};

module.exports = clientController; 