const { FlowResponse, Client, Flow, Step } = require('../models');
const logger = require('../utils/logger');

const flowResponseController = {
  // Получить все ответы на флоу
  async getAllResponses(req, res) {
    try {
      const responses = await FlowResponse.findAll({
        include: [
          { model: Client, as: 'client' },
          { model: Flow, as: 'flow' },
        ],
        order: [['created_at', 'DESC']]
      });
      
      res.json(responses);
    } catch (error) {
      logger.error('Error fetching flow responses:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Получить ответы по ID флоу
  async getResponsesByFlowId(req, res) {
    try {
      const { flowId } = req.params;
      
      const responses = await FlowResponse.findAll({
        where: { flow_id: flowId },
        include: [
          { model: Client, as: 'client' },
          { model: Flow, as: 'flow' },
        ],
        order: [['created_at', 'DESC']]
      });
      
      res.json(responses);
    } catch (error) {
      logger.error(`Error fetching responses for flow ${req.params.flowId}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Получить ответы по ID клиента
  async getResponsesByClientId(req, res) {
    try {
      const { clientId } = req.params;
      
      const responses = await FlowResponse.findAll({
        where: { client_id: clientId },
        include: [
          { model: Flow, as: 'flow' },
        ],
        order: [['created_at', 'DESC']]
      });
      
      res.json(responses);
    } catch (error) {
      logger.error(`Error fetching responses for client ${req.params.clientId}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Получить ответ по ID
  async getResponseById(req, res) {
    try {
      const { id } = req.params;
      
      const response = await FlowResponse.findByPk(id, {
        include: [
          { model: Client, as: 'client' },
          { 
            model: Flow, 
            as: 'flow', 
            include: [{ model: Step, as: 'flowSteps' }] 
          },
        ]
      });
      
      if (!response) {
        return res.status(404).json({ error: 'Flow response not found' });
      }
      
      // Форматируем ответы для более удобного чтения
      const formattedResponse = this.formatResponseData(response);
      
      res.json(formattedResponse);
    } catch (error) {
      logger.error(`Error fetching response ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Форматирование данных ответа для удобного отображения
  formatResponseData(response) {
    try {
      const formattedResponse = response.toJSON();
      
      // Получаем шаги флоу в правильном порядке
      const steps = formattedResponse.flow?.flowSteps || [];
      steps.sort((a, b) => a.order_index - b.order_index);
      
      // Создаем структурированный массив ответов
      const structuredResponses = [];
      
      if (formattedResponse.responses) {
        // Преобразуем ответы из формата step_id: answer в понятную структуру
        const responses = formattedResponse.responses;
        
        // Сначала собираем все ключи ответов (step_123)
        const stepKeys = Object.keys(responses).filter(key => key.match(/^step_\d+$/));
        
        for (const stepKey of stepKeys) {
          // Получаем ID шага из ключа (формат step_123)
          const stepIdMatch = stepKey.match(/step_(\d+)/);
          if (stepIdMatch && stepIdMatch[1]) {
            const stepId = parseInt(stepIdMatch[1]);
            
            // Находим соответствующий шаг
            const step = steps.find(s => s.id === stepId);
            
            // Ищем дополнительную информацию в обогащенных ответах
            const answer = responses[stepKey];
            const responseType = responses[`${stepKey}_type`] || (step ? step.response_type : 'text');
            const question = responses[`${stepKey}_question`] || (step ? step.question : `Question #${stepId}`);
            
            if (step || answer) {
              // Добавляем в массив структурированных ответов
              structuredResponses.push({
                stepId: stepId,
                orderIndex: step ? step.order_index : 999, // If step not found, put at end
                question: question,
                responseType: responseType,
                answer: answer,
                options: step ? (step.options || []) : []
              });
            }
          }
        }
        
        // Сортируем ответы по order_index
        structuredResponses.sort((a, b) => a.orderIndex - b.orderIndex);
        
        // Добавляем структурированные ответы в результат
        formattedResponse.structuredResponses = structuredResponses;
      }
      
      return formattedResponse;
    } catch (error) {
      logger.error(`Error formatting response data:`, error);
      return response;
    }
  },

  // Создать новый ответ на флоу
  async createResponse(req, res) {
    try {
      const { client_id, flow_id, responses } = req.body;
      
      // Проверяем, существуют ли клиент и флоу
      const client = await Client.findByPk(client_id);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      const flow = await Flow.findByPk(flow_id);
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      const newResponse = await FlowResponse.create({
        client_id,
        flow_id,
        responses,
        completed: false
      });
      
      res.status(201).json(newResponse);
    } catch (error) {
      logger.error('Error creating flow response:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Обновить существующий ответ на флоу
  async updateResponse(req, res) {
    try {
      const { id } = req.params;
      const { responses, completed } = req.body;
      
      const response = await FlowResponse.findByPk(id);
      
      if (!response) {
        return res.status(404).json({ error: 'Flow response not found' });
      }
      
      // Обновляем ответы и статус завершения
      const updates = { responses };
      
      if (completed !== undefined) {
        updates.completed = completed;
        if (completed) {
          updates.completed_at = new Date();
        } else {
          updates.completed_at = null;
        }
      }
      
      await response.update(updates);
      
      res.json(response);
    } catch (error) {
      logger.error(`Error updating response ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Отметить ответ как завершенный
  async completeResponse(req, res) {
    try {
      const { id } = req.params;
      
      const response = await FlowResponse.findByPk(id);
      
      if (!response) {
        return res.status(404).json({ error: 'Flow response not found' });
      }
      
      await response.update({
        completed: true,
        completed_at: new Date()
      });
      
      res.json(response);
    } catch (error) {
      logger.error(`Error completing response ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Удалить ответ на флоу
  async deleteResponse(req, res) {
    try {
      const { id } = req.params;
      
      const response = await FlowResponse.findByPk(id);
      
      if (!response) {
        return res.status(404).json({ error: 'Flow response not found' });
      }
      
      await response.destroy();
      
      res.json({ message: 'Flow response deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting response ${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  },

  // Получить форматированные данные о всех ответах для конкретного флоу
  async getFormattedResponsesByFlowId(req, res) {
    try {
      const { flowId } = req.params;
      
      // Получаем flow с шагами
      const flow = await Flow.findByPk(flowId, {
        include: [{ model: Step, as: 'flowSteps' }]
      });
      
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      
      // Получаем все ответы для этого flow
      const responses = await FlowResponse.findAll({
        where: { flow_id: flowId },
        include: [{ model: Client, as: 'client' }],
        order: [['created_at', 'DESC']]
      });
      
      // Подготавливаем шаги для использования
      const steps = flow.flowSteps || [];
      steps.sort((a, b) => a.order_index - b.order_index);
      
      // Форматируем каждый ответ
      const formattedResponses = responses.map(response => {
        // Создаем копию ответа для форматирования
        const responseJson = response.toJSON();
        
        // Создаем структурированный массив ответов
        const structuredResponses = [];
        
        if (responseJson.responses) {
          // Получаем все ответы
          const responses = responseJson.responses;
          
          // Сначала собираем все ключи ответов (step_123)
          const stepKeys = Object.keys(responses).filter(key => key.match(/^step_\d+$/));
          
          for (const stepKey of stepKeys) {
            // Получаем ID шага из ключа (формат step_123)
            const stepIdMatch = stepKey.match(/step_(\d+)/);
            if (stepIdMatch && stepIdMatch[1]) {
              const stepId = parseInt(stepIdMatch[1]);
              
              // Находим соответствующий шаг
              const step = steps.find(s => s.id === stepId);
              
              // Ищем дополнительную информацию в обогащенных ответах
              const answer = responses[stepKey];
              const responseType = responses[`${stepKey}_type`] || (step ? step.response_type : 'text');
              const question = responses[`${stepKey}_question`] || (step ? step.question : `Question #${stepId}`);
              
              if (step || answer) {
                // Добавляем в массив структурированных ответов
                structuredResponses.push({
                  stepId: stepId,
                  orderIndex: step ? step.order_index : 999, // If step not found, put at end
                  question: question,
                  responseType: responseType,
                  answer: answer,
                  options: step ? (step.options || []) : []
                });
              }
            }
          }
          
          // Сортируем ответы по order_index
          structuredResponses.sort((a, b) => a.orderIndex - b.orderIndex);
          
          // Добавляем структурированные ответы в результат
          responseJson.structuredResponses = structuredResponses;
        }
        
        return responseJson;
      });
      
      res.json(formattedResponses);
    } catch (error) {
      logger.error(`Error fetching formatted responses for flow ${req.params.flowId}:`, error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = flowResponseController; 