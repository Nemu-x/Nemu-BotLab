const { Client, Message, User, Role, Command, Flow, Ticket } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

/**
 * Контроллер для обработки запросов к дашборду
 */
class DashboardController {
  /**
   * Получение общей статистики для дашборда
   */
  async getStats(req, res) {
    try {
      logger.info('Получение статистики для дашборда');
      
      // Текущая дата и дата 30 дней назад для статистики
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Параллельное выполнение запросов для ускорения
      const [
        totalClients,
        newClientsThisMonth,
        activeClientsToday,
        totalMessages,
        todayMessages,
        totalOperators,
        activeOperators,
        totalCommands,
        activeCommands,
        totalFlows,
        activeFlows,
        totalTickets,
        openTickets
      ] = await Promise.all([
        // Общее количество клиентов
        Client.count(),
        
        // Новые клиенты за последние 30 дней
        Client.count({
          where: {
            created_at: {
              [Op.gte]: thirtyDaysAgo
            }
          }
        }),
        
        // Активные клиенты за последние 24 часа
        Client.count({
          where: {
            last_message_at: {
              [Op.gte]: oneDayAgo
            }
          }
        }),
        
        // Общее количество сообщений
        Message.count(),
        
        // Сообщения за сегодня
        Message.count({
          where: {
            created_at: {
              [Op.gte]: oneDayAgo
            }
          }
        }),
        
        // Общее количество операторов
        User.count({
          include: [{
            model: Role,
            where: {
              name: 'operator'
            }
          }]
        }),
        
        // Активные операторы
        User.count({
          where: {
            is_active: true
          },
          include: [{
            model: Role,
            where: {
              name: 'operator'
            }
          }]
        }),
        
        // Общее количество команд
        Command.count(),
        
        // Активные команды
        Command.count({
          where: {
            is_active: true
          }
        }),
        
        // Общее количество flows
        Flow.count(),
        
        // Активные flows
        Flow.count({
          where: {
            is_active: true
          }
        }),
        
        // Общее количество тикетов
        Ticket.count(),
        
        // Открытые тикеты
        Ticket.count({
          where: {
            status: {
              [Op.in]: ['open', 'in_progress']
            }
          }
        })
      ]);

      // Расчет показателей эффективности
      const responseRatio = await calculateResponseRatio();
      const avgResponseTime = await calculateAvgResponseTime();
      
      // Формирование итогового объекта со статистикой
      const stats = {
        clients: {
          total: totalClients,
          newThisMonth: newClientsThisMonth,
          activeToday: activeClientsToday,
          growthRate: calculateGrowthRate(totalClients, newClientsThisMonth)
        },
        messages: {
          total: totalMessages,
          today: todayMessages,
          averagePerDay: Math.round(totalMessages / 30) // Примерное среднее за месяц
        },
        operators: {
          total: totalOperators,
          active: activeOperators
        },
        commands: {
          total: totalCommands,
          active: activeCommands
        },
        flows: {
          total: totalFlows,
          active: activeFlows
        },
        tickets: {
          total: totalTickets,
          open: openTickets,
          resolutionRate: totalTickets ? Math.round((totalTickets - openTickets) / totalTickets * 100) : 0
        },
        performance: {
          responseRate: responseRatio,
          avgResponseTime: avgResponseTime,
          customerSatisfaction: '95%' // Заглушка, в будущем можно добавить реальные данные
        }
      };
      
      return res.status(200).json(stats);
    } catch (error) {
      logger.error('Ошибка при получении статистики дашборда:', error);
      return res.status(500).json({ error: 'Ошибка при получении статистики' });
    }
  }

  /**
   * Получение данных активности для дашборда
   */
  async getActivity(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      // Получаем последние сообщения
      const recentMessages = await Message.findAll({
        limit,
        order: [['created_at', 'DESC']],
        include: [{
          model: Client,
          attributes: ['telegram_id', 'username', 'first_name', 'last_name']
        }]
      });
      
      // Получаем последних новых пользователей
      const newUsers = await Client.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'telegram_id', 'username', 'first_name', 'last_name', 'created_at']
      });
      
      // Формируем объекты активности
      const messagesActivity = recentMessages.map(message => ({
        id: message.id,
        type: 'message',
        clientId: message.client_id,
        clientName: formatClientName(message.Client),
        content: message.content,
        timestamp: message.created_at,
        isRead: message.is_read,
        direction: message.is_from_bot ? 'outgoing' : 'incoming'
      }));
      
      const newUsersActivity = newUsers.map(user => ({
        id: user.id,
        type: 'new_user',
        clientId: user.id,
        clientName: formatClientName(user),
        content: 'Новый пользователь зарегистрирован',
        timestamp: user.created_at
      }));
      
      // Объединяем и сортируем по времени
      const allActivity = [...messagesActivity, ...newUsersActivity]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      
      return res.status(200).json(allActivity);
    } catch (error) {
      logger.error('Ошибка при получении данных активности:', error);
      return res.status(500).json({ error: 'Ошибка при получении данных активности' });
    }
  }
  
  /**
   * Получение аналитики по времени суток
   */
  async getTimeAnalytics(req, res) {
    try {
      // Получаем сообщения за последние 7 дней, группируем по часам
      const timeDistribution = await Message.findAll({
        attributes: [
          [sequelize.fn('strftime', '%H', sequelize.col('created_at')), 'hour'],
          [sequelize.fn('count', '*'), 'count']
        ],
        where: {
          created_at: {
            [Op.gte]: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        group: [sequelize.fn('strftime', '%H', sequelize.col('created_at'))],
        order: [[sequelize.literal('hour'), 'ASC']]
      });
      
      // Форматируем для удобного отображения
      const hourlyDistribution = Array(24).fill(0);
      
      timeDistribution.forEach(item => {
        const hour = parseInt(item.getDataValue('hour'));
        hourlyDistribution[hour] = parseInt(item.getDataValue('count'));
      });
      
      return res.status(200).json({
        hourlyDistribution
      });
    } catch (error) {
      logger.error('Ошибка при получении аналитики по времени:', error);
      return res.status(500).json({ error: 'Ошибка при получении аналитики по времени' });
    }
  }
}

// Вспомогательные функции
function formatClientName(client) {
  if (!client) return 'Неизвестный клиент';
  
  if (client.username) return `@${client.username}`;
  
  const firstName = client.first_name || '';
  const lastName = client.last_name || '';
  
  return (firstName + ' ' + lastName).trim() || 'Клиент ID:' + client.telegram_id;
}

async function calculateResponseRatio() {
  // Здесь можно реализовать более сложную логику вычисления
  // соотношения ответов на обращения клиентов
  return '95%';
}

async function calculateAvgResponseTime() {
  // Здесь можно реализовать вычисление среднего времени ответа
  // на основе разницы между временем получения сообщения от клиента
  // и временем отправки ответа
  return '1.5 мин';
}

function calculateGrowthRate(total, newItems) {
  if (total === 0) return '0%';
  const rate = (newItems / total) * 100;
  return `${Math.round(rate)}%`;
}

module.exports = new DashboardController(); 