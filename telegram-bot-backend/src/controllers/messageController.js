const { Message, Client } = require('../models');
const botService = require('../services/bot.service');
const logger = require('../config/logger');

const messageController = {
  // Get messages for a client
  async getClientMessages(req, res) {
    try {
      const { clientId } = req.params;
      
      // Проверяем существование клиента
      const client = await Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Получаем сообщения только если диалог открыт
      if (!client.is_dialog_open) {
        return res.json([]); // Возвращаем пустой массив, если диалог закрыт
      }
      
      const messages = await Message.findAll({
        where: { client_id: clientId },
        order: [['created_at', 'ASC']]
      });
      
      res.json(messages);
    } catch (error) {
      logger.error('Error getting client messages:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  },

  // Send message to client
  async sendMessage(req, res) {
    try {
      const { clientId } = req.params;
      const { content } = req.body;

      // Проверяем существование клиента
      const client = await Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Проверяем, открыт ли диалог
      if (!client.is_dialog_open) {
        return res.status(403).json({ error: 'Dialog is closed. Cannot send messages.' });
      }

      // Отправляем сообщение через бота
      await botService.sendMessage(client.telegram_id, content);

      res.json({ success: true });
    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  },

  // Mark messages as read
  async markMessagesAsRead(req, res) {
    try {
      const { messageIds } = req.body;
      
      await Message.update(
        { is_read: true },
        { where: { id: messageIds } }
      );
      
      res.json({ success: true });
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  },

  // Get unread messages count
  async getUnreadMessages(req, res) {
    try {
      const messages = await Message.findAll({
        where: {
          is_read: false,
          is_from_bot: false // Только сообщения от клиентов
        },
        include: [
          {
            model: Client,
            as: 'client', // Добавляем алиас для ассоциации
            attributes: ['id', 'telegram_id', 'username', 'first_name', 'last_name', 'photo_url'],
          }
        ],
        order: [['created_at', 'DESC']]
      });

      logger.info(`Found ${messages.length} unread messages`);
      res.json(messages);
    } catch (error) {
      logger.error(`Error fetching unread messages: ${error.message}`, { error });
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = messageController; 