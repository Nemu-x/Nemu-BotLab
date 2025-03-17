const { Flow, Command, User, Step, Client } = require('../models');
const logger = require('../utils/logger');
const botService = require('../services/bot.service');

const flowController = {
  // Get all flows
  async getAllFlows(req, res) {
    try {
      const flows = await Flow.findAll({
        include: [
          {
            model: Command,
            as: 'commands'
          },
          {
            model: Step,
            as: 'flowSteps',
            attributes: ['id']
          }
        ]
      });
      
      // Enhance flow data with step count and other metadata
      const enhancedFlows = await Promise.all(flows.map(async (flow) => {
        const flowData = flow.toJSON();
        
        // Считаем количество шагов
        const stepsCount = await Step.count({
          where: { flow_id: flow.id }
        });
        
        // Add steps count and other metadata
        return {
          ...flowData,
          flowSteps: undefined, // Убираем flowSteps из ответа
          stepsCount: stepsCount,
          // Для совместимости с фронтендом
          steps: [] // Пустой массив для фронтенда, чтобы он знал, что это свойство существует
        };
      }));
      
      res.json(enhancedFlows);
    } catch (error) {
      logger.error('Error fetching flows:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get flow by ID
  async getFlowById(req, res) {
    try {
      const { id } = req.params;
      
      const flow = await Flow.findByPk(id, {
        include: [
          {
            model: Command,
            as: 'commands'
          },
          {
            model: Step,
            as: 'flowSteps',
            attributes: ['id', 'order_index', 'question', 'response_type', 'is_required', 'options', 'config']
          }
        ]
      });
      
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      // Преобразуем данные для фронтенда
      const flowData = flow.toJSON();
      
      // Добавляем steps array из flowSteps
      flowData.steps = flowData.flowSteps || [];
      delete flowData.flowSteps;
      
      // Сортируем steps по order_index
      if (flowData.steps && flowData.steps.length > 0) {
        flowData.steps.sort((a, b) => a.order_index - b.order_index);
      }
      
      res.json(flowData);
    } catch (error) {
      logger.error(`Error fetching flow ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Create a new flow
  async createFlow(req, res) {
    try {
      const { name, description, startCommandId, is_active, is_default, steps, config } = req.body;
      
      // Set the createdBy field to the current user's ID or default to admin (1)
      const createdBy = req.user ? req.user.id : 1; // Используем 1 (admin) как значение по умолчанию
      
      if (!req.user) {
        logger.warn('Creating flow without real user ID - using default admin (ID: 1)');
      }
      
      // Check if startCommandId is provided and valid
      if (startCommandId) {
        const command = await Command.findByPk(startCommandId);
        if (!command) {
          logger.warn(`Invalid startCommandId: ${startCommandId}. Command not found.`);
        } else {
          logger.info(`New flow will be linked to command: ${command.command} (ID: ${command.id})`);
        }
      } else {
        logger.warn(`Creating flow without a start command - will only trigger if set as default`);
      }
      
      // Если flow помечен как is_default=true, сбросим этот флаг у всех остальных flows
      if (is_default) {
        await Flow.update(
          { is_default: false },
          { where: { is_default: true } }
        );
      }
      
      const flow = await Flow.create({
        name,
        description,
        startCommandId,
        is_active: is_active,
        is_default: is_default || false,
        steps: steps || [],
        config: config || {},
        created_by: createdBy
      });
      
      // Обновляем бота с новым flow
      try {
        await botService.refreshFlows();
        logger.info(`Bot service refreshed after creating flow ${flow.id}`);
      } catch (error) {
        logger.error(`Error refreshing bot service after creating flow:`, error);
      }
      
      res.status(201).json(flow);
    } catch (error) {
      logger.error('Error creating flow:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update a flow
  async updateFlow(req, res) {
    try {
      const { id } = req.params;
      const { name, description, startCommandId, is_active, is_default, steps, config } = req.body;
      
      logger.info(`Updating flow ${id} with data:`, { name, description, startCommandId, is_active, is_default });
      
      const flow = await Flow.findByPk(id);
      
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      // Check if startCommandId is provided and valid
      if (startCommandId) {
        const command = await Command.findByPk(startCommandId);
        if (!command) {
          logger.warn(`Invalid startCommandId: ${startCommandId}. Command not found.`);
        } else {
          logger.info(`Flow ${id} linked to command: ${command.command} (ID: ${command.id})`);
        }
      } else {
        logger.warn(`Flow ${id} has no start command defined`);
      }
      
      // Если flow помечен как is_default=true, сбросим этот флаг у всех остальных flows
      if (is_default && !flow.is_default) {
        await Flow.update(
          { is_default: false },
          { where: { is_default: true } }
        );
      }
      
      await flow.update({
        name,
        description,
        startCommandId,
        is_active: is_active,
        is_default: is_default || false,
        steps: steps || flow.steps,
        config: config || flow.config
      });
      
      // Обновляем бота с обновленным flow
      try {
        await botService.refreshFlows();
        logger.info(`Bot service refreshed after updating flow ${flow.id}`);
      } catch (error) {
        logger.error(`Error refreshing bot service after updating flow:`, error);
      }
      
      res.json(flow);
    } catch (error) {
      logger.error(`Error updating flow ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete a flow
  async deleteFlow(req, res) {
    try {
      const { id } = req.params;
      
      const flow = await Flow.findByPk(id, {
        include: [{ model: Step, as: 'flowSteps' }]
      });
      
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      // Проверяем наличие связанных шагов
      if (flow.flowSteps && flow.flowSteps.length > 0) {
        logger.info(`Flow ${id} has ${flow.flowSteps.length} steps that will be deleted`);
        
        // Удаляем шаги
        for (const step of flow.flowSteps) {
          await step.destroy();
        }
      }
      
      // Удаляем Flow
      await flow.destroy();
      
      // Обновляем бота с обновленными данными
      try {
        await botService.refreshFlows();
        logger.info(`Bot service refreshed after deleting flow ${id}`);
      } catch (error) {
        logger.error(`Error refreshing bot service after deleting flow:`, error);
      }
      
      res.json({ message: 'Flow deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting flow ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get all commands associated with a flow
  async getFlowCommands(req, res) {
    try {
      const { id } = req.params;
      
      const flow = await Flow.findByPk(id, {
        include: [{ model: Command, as: 'commands' }]
      });
      
      if (!flow) {
        logger.warn(`Flow with id ${id} not found`);
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      logger.info(`Returning ${flow.commands.length} commands for flow ${id}`);
      res.json(flow.commands);
    } catch (error) {
      logger.error(`Error getting commands for flow ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get all steps associated with a flow
  async getFlowSteps(req, res) {
    try {
      const { id } = req.params;
      
      const flow = await Flow.findByPk(id);
      
      if (!flow) {
        logger.warn(`Flow with id ${id} not found`);
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      const steps = await Step.findAll({
        where: { flow_id: id },
        order: [['order_index', 'ASC']]
      });
      
      // Конвертируем поля из snake_case в camelCase для фронтенда
      const formattedSteps = steps.map(step => {
        const stepData = step.toJSON();
        return {
          id: stepData.id,
          flowId: stepData.flow_id,
          orderIndex: stepData.order_index,
          question: stepData.question,
          responseType: stepData.response_type,
          isRequired: stepData.is_required,
          options: stepData.options,
          config: stepData.config,
          createdAt: stepData.created_at,
          updatedAt: stepData.updated_at
        };
      });
      
      logger.info(`Returning ${formattedSteps.length} steps for flow ${id}`);
      res.json(formattedSteps);
    } catch (error) {
      logger.error(`Error getting steps for flow ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Добавить шаг в опросник
  async addFlowStep(req, res) {
    try {
      const { id } = req.params;
      const { 
        question, 
        response_type, 
        is_required,
        options,
        config,
        nextStepId,
        isFinal
      } = req.body;
      
      const flow = await Flow.findByPk(id);
      
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      // Создаем новый шаг в базе данных
      const newStep = await Step.create({
        flow_id: parseInt(id),
        question: question || 'New question',
        response_type: response_type || 'text',
        is_required: is_required !== undefined ? is_required : true,
        options: options || [],
        config: config || {},
        nextStepId: nextStepId || null,
        isFinal: isFinal || false,
        order_index: await Step.count({ where: { flow_id: parseInt(id) } }) + 1
      });
      
      // Обновляем бота с обновленным flow
      try {
        await botService.refreshFlows();
        logger.info(`Bot service refreshed after adding step to flow ${flow.id}`);
      } catch (error) {
        logger.error(`Error refreshing bot service after adding step:`, error);
      }
      
      // Конвертируем поля из snake_case в camelCase для фронтенда
      const stepData = newStep.toJSON();
      const formattedStep = {
        id: stepData.id,
        flowId: stepData.flow_id,
        orderIndex: stepData.order_index,
        question: stepData.question,
        responseType: stepData.response_type,
        isRequired: stepData.is_required,
        options: stepData.options,
        config: stepData.config,
        createdAt: stepData.created_at,
        updatedAt: stepData.updated_at
      };
      
      res.json(formattedStep);
    } catch (error) {
      logger.error(`Error adding step to flow ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Обновить шаг опросника
  async updateFlowStep(req, res) {
    try {
      const { id, stepId } = req.params;
      const { 
        question, 
        response_type, 
        is_required,
        options,
        config,
        nextStepId,
        isFinal,
        conditions,
        parse_mode,
        media,
        button_style,
        hide_step_counter
      } = req.body;
      
      const flow = await Flow.findByPk(id);
      
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      // Находим шаг в базе данных
      const step = await Step.findOne({
        where: {
          id: parseInt(stepId),
          flow_id: parseInt(id)
        }
      });
      
      if (!step) {
        return res.status(404).json({ error: 'Step not found' });
      }
      
      // Логируем полученные данные для отладки
      logger.info(`Updating step ID: ${stepId} for flow ID: ${id}`, req.body);
      
      // Обработка nextStepId
      let parsedNextStepId = null;
      if (nextStepId !== undefined) {
        // Если это пустая строка или null, устанавливаем null
        if (nextStepId === '' || nextStepId === null) {
          parsedNextStepId = null;
        } else {
          // Иначе пробуем преобразовать в число
          parsedNextStepId = parseInt(nextStepId) || null;
        }
      } else if (config && config.nextStep) {
        // Если nextStepId не задан, но есть config.nextStep, используем его
        parsedNextStepId = parseInt(config.nextStep) || null;
      }
      
      logger.info(`Parsed nextStepId: ${parsedNextStepId} from input: ${nextStepId}`);
      
      // ВАЖНО: используем response_type именно из запроса без модификаций
      // Обновляем шаг
      await step.update({
        question: question || step.question,
        response_type: response_type, // Сохраняем именно тот тип, который был отправлен
        is_required: is_required !== undefined ? !!is_required : step.is_required,
        options: options || step.options,
        config: config || step.config,
        next_step_id: parsedNextStepId, // Используем snake_case для соответствия модели
        isFinal: isFinal !== undefined ? !!isFinal : step.isFinal,
        conditions: conditions || step.conditions,
        parse_mode: parse_mode || step.parse_mode,
        media: media || step.media,
        button_style: button_style || step.button_style,
        hide_step_counter: hide_step_counter !== undefined ? !!hide_step_counter : step.hide_step_counter
      });
      
      // Обновляем бота с обновленным flow
      try {
        await botService.refreshFlows();
        logger.info(`Bot service refreshed after updating step in flow ${flow.id}`);
      } catch (error) {
        logger.error(`Error refreshing bot service after updating step:`, error);
      }
      
      // Загружаем обновленный шаг для ответа
      const updatedStep = await Step.findByPk(step.id);
      
      // Конвертируем поля из snake_case в camelCase для фронтенда
      const stepData = updatedStep.toJSON();
      const formattedStep = {
        id: stepData.id,
        flowId: stepData.flow_id,
        orderIndex: stepData.order_index,
        question: stepData.question,
        responseType: stepData.response_type,
        isRequired: stepData.is_required,
        options: stepData.options,
        config: stepData.config,
        nextStepId: stepData.next_step_id?.toString() || null,
        isFinal: stepData.isFinal,
        conditions: stepData.conditions,
        parse_mode: stepData.parse_mode,
        media: stepData.media,
        button_style: stepData.button_style,
        hide_step_counter: stepData.hide_step_counter,
        createdAt: stepData.created_at,
        updatedAt: stepData.updated_at
      };
      
      // Логируем отформатированный ответ для отладки
      logger.info(`Updated step:`, formattedStep);
      
      res.json(formattedStep);
    } catch (error) {
      logger.error(`Error updating step ${req.params.stepId} in flow ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Удалить шаг опросника
  async deleteFlowStep(req, res) {
    try {
      const { id, stepId } = req.params;
      
      const flow = await Flow.findByPk(id);
      
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      // Находим шаг в базе данных
      const step = await Step.findOne({
        where: {
          id: parseInt(stepId),
          flow_id: parseInt(id)
        }
      });
      
      if (!step) {
        return res.status(404).json({ error: 'Step not found' });
      }
      
      // Удаляем шаг
      await step.destroy();
      
      // Перенумеруем оставшиеся шаги
      const remainingSteps = await Step.findAll({
        where: { flow_id: parseInt(id) },
        order: [['order_index', 'ASC']]
      });
      
      for (let i = 0; i < remainingSteps.length; i++) {
        await remainingSteps[i].update({ order_index: i + 1 });
      }
      
      res.json({ message: 'Step deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting step ${req.params.stepId} from flow ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Установить flow как default
  async setDefaultFlow(req, res) {
    try {
      const { id } = req.params;
      
      // Сбрасываем флаг у всех flows
      await Flow.update(
        { is_default: false },
        { where: { is_default: true } }
      );
      
      // Устанавливаем флаг у выбранного flow
      const flow = await Flow.findByPk(id);
      
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      await flow.update({ is_default: true });
      
      // Обновляем бота с обновленным flow
      try {
        await botService.refreshFlows();
        logger.info(`Bot service refreshed after setting flow ${flow.id} as default`);
      } catch (error) {
        logger.error(`Error refreshing bot service after setting flow as default:`, error);
      }
      
      res.json({ message: 'Flow set as default successfully', flow });
    } catch (error) {
      logger.error(`Error setting flow ${req.params.id} as default:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Try to find a default flow
  async setupBaseCommands(req, res) {
    try {
      // Try to find a default flow
      const defaultFlow = await Flow.findOne({
        where: { is_default: true, is_active: true },
        include: [{ model: Command, as: 'commands' }]
      });

      if (!defaultFlow) {
        logger.warn('No default flow found');
        return res.status(200).json({ message: 'No default flow found' });
      }

      res.json(defaultFlow);
    } catch (error) {
      logger.error('Error setting up base commands:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Отправить приглашение пройти опросник
  async sendFlowInvitation(req, res) {
    try {
      const { id } = req.params;
      const { clientId, message } = req.body;
      
      // Проверяем, существует ли опросник
      const flow = await Flow.findByPk(id);
      
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      // Проверяем, существует ли клиент
      const client = await Client.findByPk(clientId);
      
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      // Проверяем, есть ли у клиента telegram_id
      if (!client.telegram_id) {
        return res.status(400).json({ error: 'Client has no Telegram ID' });
      }
      
      // Отправляем приглашение
      const success = await botService.sendFlowInvitation(
        client.telegram_id, 
        client.id, 
        parseInt(id), 
        message
      );
      
      if (!success) {
        return res.status(500).json({ error: 'Failed to send invitation' });
      }
      
      res.json({ 
        success: true, 
        message: 'Invitation sent successfully',
        flowId: parseInt(id),
        clientId: client.id
      });
    } catch (error) {
      logger.error(`Error sending flow invitation for flow ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = flowController; 