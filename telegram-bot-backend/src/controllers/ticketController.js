const { Ticket, Client, User } = require('../models');
const logger = require('../utils/logger');

/**
 * Контроллер для управления заявками
 */
class TicketController {
  /**
   * Получить все заявки
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllTickets(req, res) {
    try {
      const tickets = await Ticket.findAll({
        include: [
          { model: Client, as: 'client' },
          { model: User, as: 'assignedOperator' }
        ],
        order: [['created_at', 'DESC']]
      });
      
      return res.status(200).json(tickets);
    } catch (error) {
      logger.error('Error getting all tickets:', error);
      return res.status(500).json({ error: 'Failed to get tickets' });
    }
  }
  
  /**
   * Получить заявку по ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTicketById(req, res) {
    try {
      const { id } = req.params;
      
      const ticket = await Ticket.findByPk(id, {
        include: [
          { model: Client, as: 'client' },
          { model: User, as: 'assignedOperator' }
        ]
      });
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      return res.status(200).json(ticket);
    } catch (error) {
      logger.error(`Error getting ticket with ID ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to get ticket' });
    }
  }
  
  /**
   * Создать новую заявку
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createTicket(req, res) {
    try {
      const { title, description, client_id, priority, assigned_to } = req.body;
      
      if (!title || !client_id) {
        return res.status(400).json({ error: 'Title and client_id are required' });
      }
      
      // Проверяем, существует ли клиент
      const client = await Client.findByPk(client_id);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      // Проверяем, существует ли оператор, если указан
      if (assigned_to) {
        const operator = await User.findByPk(assigned_to);
        if (!operator) {
          return res.status(404).json({ error: 'Operator not found' });
        }
      }
      
      const ticket = await Ticket.create({
        title,
        description,
        client_id,
        status: 'open',
        priority: priority || 'medium',
        assigned_to
      });
      
      logger.info(`Created new ticket with ID ${ticket.id}`);
      
      return res.status(201).json(ticket);
    } catch (error) {
      logger.error('Error creating ticket:', error);
      return res.status(500).json({ error: 'Failed to create ticket' });
    }
  }
  
  /**
   * Обновить заявку
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateTicket(req, res) {
    try {
      const { id } = req.params;
      const { title, description, status, priority, assigned_to } = req.body;
      
      const ticket = await Ticket.findByPk(id);
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      // Проверяем, существует ли оператор, если указан
      if (assigned_to) {
        const operator = await User.findByPk(assigned_to);
        if (!operator) {
          return res.status(404).json({ error: 'Operator not found' });
        }
      }
      
      await ticket.update({
        title: title || ticket.title,
        description: description !== undefined ? description : ticket.description,
        status: status || ticket.status,
        priority: priority || ticket.priority,
        assigned_to: assigned_to !== undefined ? assigned_to : ticket.assigned_to
      });
      
      logger.info(`Updated ticket with ID ${id}`);
      
      return res.status(200).json(ticket);
    } catch (error) {
      logger.error(`Error updating ticket with ID ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to update ticket' });
    }
  }
  
  /**
   * Удалить заявку
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteTicket(req, res) {
    try {
      const { id } = req.params;
      
      const ticket = await Ticket.findByPk(id);
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      await ticket.destroy();
      
      logger.info(`Deleted ticket with ID ${id}`);
      
      return res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting ticket with ID ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to delete ticket' });
    }
  }
  
  /**
   * Назначить заявку оператору
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async assignTicketToOperator(req, res) {
    try {
      const { id, operatorId } = req.params;
      
      const ticket = await Ticket.findByPk(id);
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      // Проверяем, существует ли оператор
      const operator = await User.findByPk(operatorId);
      if (!operator) {
        return res.status(404).json({ error: 'Operator not found' });
      }
      
      await ticket.update({ assigned_to: operatorId });
      
      logger.info(`Assigned ticket with ID ${id} to operator with ID ${operatorId}`);
      
      return res.status(200).json(ticket);
    } catch (error) {
      logger.error(`Error assigning ticket with ID ${req.params.id} to operator:`, error);
      return res.status(500).json({ error: 'Failed to assign ticket to operator' });
    }
  }
  
  /**
   * Изменить статус заявки
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async changeTicketStatus(req, res) {
    try {
      const { id, status } = req.params;
      
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status',
          validStatuses
        });
      }
      
      const ticket = await Ticket.findByPk(id);
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      await ticket.update({ status });
      
      logger.info(`Changed status of ticket with ID ${id} to ${status}`);
      
      return res.status(200).json(ticket);
    } catch (error) {
      logger.error(`Error changing status of ticket with ID ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to change ticket status' });
    }
  }
  
  /**
   * Получить заявки по клиенту
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTicketsByClient(req, res) {
    try {
      const { clientId } = req.params;
      
      // Проверяем, существует ли клиент
      const client = await Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      const tickets = await Ticket.findAll({
        where: { client_id: clientId },
        include: [
          { model: User, as: 'assignedOperator' }
        ],
        order: [['created_at', 'DESC']]
      });
      
      return res.status(200).json(tickets);
    } catch (error) {
      logger.error(`Error getting tickets for client with ID ${req.params.clientId}:`, error);
      return res.status(500).json({ error: 'Failed to get tickets for client' });
    }
  }
  
  /**
   * Получить заявки по оператору
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTicketsByOperator(req, res) {
    try {
      const { operatorId } = req.params;
      
      // Проверяем, существует ли оператор
      const operator = await User.findByPk(operatorId);
      if (!operator) {
        return res.status(404).json({ error: 'Operator not found' });
      }
      
      const tickets = await Ticket.findAll({
        where: { assigned_to: operatorId },
        include: [
          { model: Client, as: 'client' }
        ],
        order: [['created_at', 'DESC']]
      });
      
      return res.status(200).json(tickets);
    } catch (error) {
      logger.error(`Error getting tickets for operator with ID ${req.params.operatorId}:`, error);
      return res.status(500).json({ error: 'Failed to get tickets for operator' });
    }
  }
}

module.exports = new TicketController(); 