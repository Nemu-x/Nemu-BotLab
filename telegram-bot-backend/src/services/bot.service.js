const TelegramBot = require('node-telegram-bot-api');
const logger = require('../config/logger');
const db = require('../models');
const { Command, Settings, Client, Message, Flow, Step, FlowResponse } = db;

class BotService {
  constructor() {
    this.bot = null;
    this.commands = [];
    this.clientSurveyState = {};
    this.token = null;
  }

  async initialize() {
    try {
      logger.info('Initializing bot service...');
      
      // Получаем токен из базы данных
      let settings = await Settings.findOne({
        where: { key: 'botToken' }
      });
      
      if (!settings || !settings.value) {
        logger.warn('Bot token not found in settings, checking for bot_token key...');
        
        // Проверяем альтернативный ключ
        settings = await Settings.findOne({
          where: { key: 'bot_token' }
      });

      if (!settings || !settings.value) {
          logger.warn('Bot token not found in settings, creating default token...');
          
          // Создаем запись с пустым токеном
          await Settings.create({
            key: 'botToken',
            value: '',
            description: 'Telegram Bot Token'
          });
          
          logger.info('Default token created. Please set the token in the settings page.');
        return false;
        }
      }
      
      this.token = settings.value;
      
      // Если токен пустой, выходим
      if (!this.token) {
        logger.warn('Bot token is empty. Please set the token in the settings page.');
        return false;
      }
      
      // Создаем экземпляр бота
      this.bot = new TelegramBot(this.token, { polling: true });
      logger.info('Bot instance created');
      
      // Инициализируем состояние опросов
      this.clientSurveyState = {};
      
      // Загружаем команды из базы данных
      await this.loadCommands();
      
      // Обновляем команды в Telegram
      await this.updateCommands();
      
      // Устанавливаем обработчики событий
      this.setupEventHandlers();
      
      // Устанавливаем базовые команды
      await this.setupBaseCommands();
      
      // Загружаем потоки из базы данных
      await this.refreshFlows();

      logger.info('Bot service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Error initializing bot service:', error);
      return false;
    }
  }

  async loadCommands() {
    try {
      logger.info('Loading commands from database...');
      
      // Получаем активные команды из базы данных
      const commands = await Command.findAll({
        where: {
          is_active: true
        }
      });
      
      logger.info(`Found ${commands.length} commands`);
      
      // Очищаем текущий список команд
      this.commands = [];
      
      // Обновляем список команд
      for (const cmd of commands) {
        // Проверяем, что команда имеет все необходимые поля
        if (!cmd.name) {
          logger.warn(`Skipping command with ID ${cmd.id} because it has no name`);
          continue;
        }
        
        // Для slash-команд убеждаемся, что имя начинается с /
        let commandName = cmd.name;
        if (cmd.type === 'slash' && !commandName.startsWith('/')) {
          commandName = '/' + commandName;
        }
        
        this.commands.push({
          id: cmd.id,
          command: commandName,
          description: cmd.description || '',
          response: cmd.response || '',
          matchType: cmd.match_type || 'contains',
          type: cmd.type || (commandName.startsWith('/') ? 'slash' : 'text'),
          isActive: true,
          action: cmd.action || null
        });
      }
      
      logger.info(`Loaded ${this.commands.length} commands`);
      
      // Удаляем вызов updateCommands, чтобы избежать бесконечного цикла
      // await this.updateCommands();
    } catch (error) {
      logger.error('Error loading commands:', error);
      throw error;
    }
  }

  async setupBaseCommands() {
    try {
      // Handle /start command
      this.bot.onText(/^\/start(?:\s+(.+))?$/, async (msg, match) => {
        try {
          const chatId = msg.chat.id;
          logger.info(`Start command received from user ${msg.from.id} in chat ${chatId}`);
          
          // Обрабатываем сообщение и получаем/создаем клиента
          const client = await this.handleClientMessage(msg);
          
          if (!client) {
            logger.warn(`Cannot process start command: client not found for chat ${chatId}`);
            return;
          }
          
          // Проверяем, не находится ли клиент уже в процессе опроса
          if (this.clientSurveyState && this.clientSurveyState[client.id]) {
            logger.info(`Client ${client.id} is already in an active flow, ignoring /start command`);
            await this.bot.sendMessage(chatId, 'У вас уже есть активный опрос. Для отмены текущего опроса используйте команду /cancel.');
            return;
          }
          
          // Проверяем, есть ли параметр в команде /start
          const param = match[1];
          
          if (param) {
            // Если есть параметр, пытаемся найти flow по этому параметру
            logger.info(`Start command with parameter: ${param}`);
            
            // Здесь можно добавить логику для обработки параметров
            // Например, запуск конкретного flow по ID или коду
          } else {
            // Если параметра нет, запускаем дефолтный flow
            const defaultFlow = await Flow.findOne({
              where: { is_default: true },
              include: [{ model: Step, as: 'flowSteps' }]
            });
            
            if (defaultFlow) {
              logger.info(`Starting default flow (ID: ${defaultFlow.id}) for client ${client.id}`);
              await this.startFlow(chatId, client.id, defaultFlow);
          } else {
              logger.warn('No default flow found');
              await this.bot.sendMessage(chatId, 'Добро пожаловать! К сожалению, нет доступных опросов.');
            }
          }
        } catch (error) {
          logger.error('Error handling start command:', error);
        }
      });

      // Handle /help command
      this.bot.onText(/\/help/, async (msg) => {
        try {
          logger.info(`Received /help command from ${msg.chat.id}`);
          const client = await this.handleClientMessage(msg);
          
          const helpCommand = this.commands.find(cmd => cmd.command === '/help');
          
          let response;
          if (helpCommand) {
            response = helpCommand.response;
          } else {
            const commandList = this.commands
              .filter(cmd => cmd.type === 'slash' && cmd.isActive)
              .map(cmd => `• ${cmd.command}`)
              .join('\n');
            
            response = commandList.length > 0
              ? `Доступные команды:\n${commandList}`
              : 'В данный момент доступных команд нет.';
          }
          
          await this.bot.sendMessage(msg.chat.id, response);
          
          // Только если клиент был создан успешно, записываем ответ в базу
          if (client && helpCommand) {
            await this.handleBotResponse(client.id, msg, response);
          } else {
            logger.warn(`Cannot save bot response: client not found for chat ${msg.chat.id}`);
          }
        } catch (error) {
          logger.error('Error handling /help command:', error);
          // Send a fallback response to the user
          await this.bot.sendMessage(msg.chat.id, 'Список доступных команд временно недоступен.');
        }
      });

      // Handle custom slash commands
      this.commands.forEach((command) => {
        if (command.type === 'slash') {
          const commandPattern = command.command.startsWith('/') ? 
            command.command : `/${command.command}`;
          
          logger.info(`Registering handler for slash command: ${commandPattern}`);
          
          this.bot.onText(new RegExp(`^${commandPattern}$`), async (msg) => {
            try {
              logger.info(`Received ${commandPattern} command from ${msg.chat.id}`);
              const client = await this.handleClientMessage(msg);
              await this.bot.sendMessage(msg.chat.id, command.response);
              
              // Только если клиент был создан успешно, записываем ответ в базу
              if (client) {
                await this.handleBotResponse(client.id, msg, command.response);
              } else {
                logger.warn(`Cannot save bot response: client not found for chat ${msg.chat.id}`);
              }
            } catch (error) {
              logger.error(`Error handling ${commandPattern} command:`, error);
              // Send response anyway
              await this.bot.sendMessage(msg.chat.id, command.response);
            }
          });
        }
      });

      // Handle all other messages
      this.bot.on('message', async (msg) => {
        try {
          // Обрабатываем специальные команды
          if (msg.text && msg.text.startsWith('/')) {
            const handled = await this.handleSpecialCommands(msg);
            if (handled) {
              logger.info(`Special command handled: ${msg.text}`);
              return;
            }
            
            // Если команда не обработана специальным обработчиком, продолжаем обычную обработку
            const client = await this.handleClientMessage(msg);
            
            // Если клиент не был создан успешно, прерываем обработку
            if (!client) {
              logger.warn(`Cannot process command: client not found for chat ${msg.chat.id}`);
              return;
            }
            
            // Сохраняем сообщение клиента в базу данных
            await Message.create({
              client_id: client.id,
              message_content: msg.text,
              is_from_bot: false,
              telegram_message_id: msg.message_id.toString(),
              created_at: new Date(),
              updated_at: new Date()
            });
            
            // Проверяем, есть ли команда в списке команд
            const command = this.matchCommand(msg);
            if (command && command.isActive) {
              logger.info(`Found matching command: ${command.command} (Active: ${command.isActive})`);
              await this.bot.sendMessage(msg.chat.id, command.response);
              await this.handleBotResponse(client.id, msg, command.response);
            } else {
              logger.info(`No matching command found for: ${msg.text}`);
            }
            
            return;
          }
          
          if (msg.text) {
            logger.info(`Received message from ${msg.chat.id}: ${msg.text}`);
            const client = await this.handleClientMessage(msg);
            
            // Если клиент не был создан успешно, прерываем обработку
            if (!client) {
              logger.warn(`Cannot process message: client not found for chat ${msg.chat.id}`);
              return;
            }

            // Сохраняем сообщение клиента в базу данных
            await Message.create({
              client_id: client.id,
              message_content: msg.text,
              is_from_bot: false,
              telegram_message_id: msg.message_id.toString(),
              created_at: new Date(),
              updated_at: new Date()
            });

            // Проверяем статус диалога
            if (!client.is_dialog_open) {
              // Если диалог закрыт, отправляем автоматическое сообщение
              const autoResponse = 'В данный момент диалог закрыт. Пожалуйста, дождитесь, когда оператор откроет диалог для продолжения общения.';
              await this.bot.sendMessage(msg.chat.id, autoResponse);
              await Message.create({
                client_id: client.id,
                message_content: autoResponse,
                is_from_bot: true,
                created_at: new Date(),
                updated_at: new Date()
              });
              return;
            }
            
            // Если клиент находится в процессе опросника, обрабатываем ответ
            if (client.current_flow_id && this.clientSurveyState && this.clientSurveyState[client.id]) {
              await this.handleSurveyResponse(msg, client);
              return; // Прерываем обработку, чтобы не отвечать другими командами
            }
            
            // Проверяем, не является ли сообщение текстовой командой "старт" или "start"
            const lowerText = msg.text.toLowerCase();
            if (lowerText === 'старт' || lowerText === 'start') {
              // Проверяем, не находится ли клиент уже в процессе опроса
              if (this.clientSurveyState && this.clientSurveyState[client.id]) {
                logger.info(`Client ${client.id} is already in an active flow, ignoring text start command`);
                await this.bot.sendMessage(msg.chat.id, 'У вас уже есть активный опрос. Для отмены текущего опроса используйте команду /cancel.');
                return;
              }
              
              // Запускаем дефолтный flow
              const defaultFlow = await Flow.findOne({
                where: { is_default: true },
                include: [{ model: Step, as: 'flowSteps' }]
              });
              
              if (defaultFlow) {
                logger.info(`Starting default flow (ID: ${defaultFlow.id}) for client ${client.id} from text command`);
                await this.startFlow(msg.chat.id, client.id, defaultFlow);
                return;
              }
            }
            
            const command = this.matchCommand(msg);
            if (command && command.isActive) {
              logger.info(`Found matching command: ${command.command} (Active: ${command.isActive})`);
              await this.bot.sendMessage(msg.chat.id, command.response);
              await this.handleBotResponse(client.id, msg, command.response);
            }
          }
        } catch (error) {
          logger.error('Error handling message:', error);
        }
      });

      // Handle callback_query (нажатия на inline кнопки)
      this.bot.on('callback_query', async (callbackQuery) => {
        try {
          const chatId = callbackQuery.message.chat.id;
          const messageId = callbackQuery.message.message_id;
          
          // Получаем данные из callback_data
          let data;
          try {
            data = JSON.parse(callbackQuery.data);
            logger.debug(`Received callback query: ${JSON.stringify(data)}`);
          } catch (e) {
            logger.error('Error parsing callback data:', e);
            return;
          }
          
          // Получаем клиента
          const client = await this.handleClientMessage(callbackQuery.message);
          if (!client) {
            logger.warn(`Client not found for chat ${chatId}`);
                return;
              }
              
          logger.debug(`Processing callback query for client ${client.id}, action: ${data.action}, step_id: ${data.step_id}, value: ${data.value}`);
                
          // Обрабатываем различные типы действий
          switch (data.action) {
            case 'flow_response':
              // Отвечаем на callback query
              await this.bot.answerCallbackQuery(callbackQuery.id);
              
              // Проверяем, находится ли клиент в процессе опроса
              if (!this.clientSurveyState || !this.clientSurveyState[client.id]) {
                logger.warn(`No active flow state for client ${client.id}`);
                await this.bot.sendMessage(chatId, 'Ошибка: опрос не активен. Пожалуйста, начните опрос заново.');
              return;
            }
            
              // Обрабатываем ответ на шаг flow
              await this.handleFlowResponse(chatId, client.id, data.step_id, data.value);
              break;
              
            case 'start_flow': {
              // Отвечаем на callback query
              await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Starting survey' });
              
              // Получаем ID потока из значения
              const targetFlowId = parseInt(data.value);
              
              if (isNaN(targetFlowId)) {
                logger.warn(`Invalid flow ID: ${data.value}`);
                await this.bot.sendMessage(chatId, 'Ошибка при запуске опроса: некорректный ID потока');
                return;
              }
              
              // Получаем поток из базы данных
              const flow = await Flow.findByPk(targetFlowId, {
                include: [{ model: Step, as: 'flowSteps' }]
              });
              
              if (!flow) {
                logger.warn(`Flow ${targetFlowId} not found`);
                await this.bot.sendMessage(chatId, 'Ошибка при запуске опроса: опрос не найден');
                return;
              }
              
              // Удаляем оригинальное сообщение-приглашение
              try {
                await this.bot.deleteMessage(chatId, messageId);
                logger.debug(`Deleted invitation message ${messageId} in chat ${chatId}`);
              } catch (deleteError) {
                logger.warn(`Could not delete invitation message: ${deleteError.message}`);
              }
              
              // Запускаем поток
              await this.startFlow(chatId, client.id, flow);
              break;
            }
              
            case 'decline_flow': {
              // Отвечаем на callback query
              await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Опрос отменен' });
              
              // Удаляем сообщение с приглашением
              try {
                await this.bot.deleteMessage(chatId, messageId);
              } catch (error) {
                logger.warn(`Could not delete invitation message: ${error.message}`);
              }
              
              // Отправляем сообщение об отмене
              await this.bot.sendMessage(chatId, 'Вы отказались от прохождения опроса. Если передумаете, вы всегда можете начать его снова.');
              break;
            }
              
            default:
              logger.warn(`Unknown callback action: ${data.action}`);
              await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Неизвестное действие' });
          }
        } catch (error) {
          logger.error('Error handling callback query:', error);
          try {
            await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Произошла ошибка' });
          } catch (e) {
            logger.error('Error sending callback query answer:', e);
          }
        }
      });

      // Handle /cancel command
      this.bot.onText(/\/cancel/, async (msg) => {
        try {
          const chatId = msg.chat.id;
          logger.info(`Cancel command received from user ${msg.from.id} in chat ${chatId}`);
          
          // Обрабатываем сообщение и получаем/создаем клиента
          const client = await this.handleClientMessage(msg);
          
          if (!client) {
            logger.warn(`Cannot process cancel command: client not found for chat ${chatId}`);
            return;
          }
          
          // Проверяем, не находится ли клиент уже в процессе опроса
          if (this.clientSurveyState && this.clientSurveyState[client.id]) {
            logger.info(`Client ${client.id} is already in an active flow, ignoring /cancel command`);
            
            // Отправляем сообщение в зависимости от текущего языка
            let message;
            if (client.language === 'ru') {
              message = 'У вас уже есть активный опрос. Для отмены текущего опроса используйте команду /cancel.';
            } else {
              message = 'You already have an active survey. To cancel the current survey, use the /cancel command.';
            }
            
            await this.bot.sendMessage(chatId, message);
            return;
          }
          
          // Удаляем состояние опроса
          delete this.clientSurveyState[client.id];
          
          // Обновляем клиента в базе данных
          await Client.update(
            { current_flow_id: null },
            { where: { id: client.id } }
          );
          
          // Отправляем сообщение об отмене опроса
          await this.bot.sendMessage(chatId, 'Survey cancelled. You can start a new one at any time.');
          
          logger.info(`Flow cancelled for client ${client.id}`);
        } catch (error) {
          logger.error('Error handling cancel command:', error);
        }
      });

      // Handle /language command
      this.bot.onText(/^\/language(?:\s+(.+))?$/, async (msg, match) => {
        try {
          const chatId = msg.chat.id;
          logger.info(`Language command received from user ${msg.from.id} in chat ${chatId}`);
          
          // Обрабатываем сообщение и получаем/создаем клиента
          const client = await this.handleClientMessage(msg);
          
          if (!client) {
            logger.warn(`Cannot process language command: client not found for chat ${chatId}`);
            return;
          }
          
          // Проверяем, не находится ли клиент уже в процессе опроса
          if (this.clientSurveyState && this.clientSurveyState[client.id]) {
            logger.info(`Client ${client.id} is already in an active flow, ignoring /language command`);
            
            // Отправляем сообщение в зависимости от текущего языка
            let message;
            if (client.language === 'ru') {
              message = 'У вас уже есть активный опрос. Для отмены текущего опроса используйте команду /cancel.';
            } else {
              message = 'You already have an active survey. To cancel the current survey, use the /cancel command.';
            }
            
            await this.bot.sendMessage(chatId, message);
            return;
          }
          
          // Запускаем поток выбора языка
          await this.startLanguageSelectionFlow(chatId, client.id);
        } catch (error) {
          logger.error('Error handling language command:', error);
        }
      });

      logger.info('Base commands set up successfully');
    } catch (error) {
      logger.error('Error setting up base commands:', error);
      throw error;
    }
  }

  matchCommand(message) {
    if (!message || !this.commands || this.commands.length === 0) {
      return null;
    }
    
    // Текст сообщения
    const text = message.text || '';
    
    // Ищем подходящую команду
    for (const cmd of this.commands) {
      const commandText = cmd.command; // Используем поле command из объекта команды
      
      // Для slash-команд и exact-совпадений
      if ((cmd.type === 'slash' || cmd.matchType === 'exact') && text === commandText) {
        return cmd;
      }
      
      // Для команд типа 'contains'
      if (cmd.matchType === 'contains' && text.includes(commandText)) {
        return cmd;
      }
      
      // Для regex-команд
      if (cmd.matchType === 'regexp' || cmd.matchType === 'regex') {
        try {
          const regex = new RegExp(commandText, 'i');
          if (regex.test(text)) {
            return cmd;
          }
        } catch (error) {
          logger.error(`Invalid regex pattern: ${commandText}`, error);
        }
      }
      
      // Для команд типа 'startsWith'
      if (cmd.matchType === 'startsWith' && text.startsWith(commandText)) {
        return cmd;
      }
    }
    
    return null;
  }

  async addCommand(question, answer) {
    try {
      logger.info(`Adding new command: ${question}`);
      this.commands.push({
        id: null,
        command: question,
        description: '',
        response: answer,
        matchType: 'exact',
        type: question.startsWith('/') ? 'slash' : 'text',
        isActive: true
      });
      await this.loadCommands(); // Reload commands from database
      return true;
    } catch (error) {
      logger.error('Error adding command:', error);
      throw error;
    }
  }

  async removeCommand(question) {
    try {
      logger.info(`Removing command: ${question}`);
      const result = this.commands.find(cmd => cmd.command === question);
      if (result) {
        logger.info(`Command removed: ${question}`);
        await this.loadCommands(); // Reload commands from database
      }
      return result;
    } catch (error) {
      logger.error('Error removing command:', error);
      throw error;
    }
  }

  async updateCommands() {
    try {
      logger.info('Updating bot commands...');
      
      // Фильтруем только slash-команды
      const slashCommands = this.commands.filter(cmd => 
        cmd.type === 'slash' && cmd.command.startsWith('/') && cmd.isActive
      );
      
      // Преобразуем команды в формат, понятный Telegram API
      const botCommands = slashCommands.map(cmd => ({
        command: cmd.command.substring(1), // Убираем слэш в начале
        description: cmd.description || 'No description'
      }));
      
      logger.info(`Setting ${botCommands.length} slash commands in Telegram`);
      
      // Устанавливаем команды в Telegram
      await this.bot.setMyCommands(botCommands);
      
      logger.info('Bot commands updated successfully');
      return true;
    } catch (error) {
      logger.error('Error updating bot commands:', error);
      return false;
    }
  }

  async sendMessage(chatId, message) {
    try {
      logger.info(`Sending message to chat ${chatId}`);
      
      // Находим клиента по telegram_id
      const client = await Client.findOne({
        where: { telegram_id: chatId.toString() }
      });
      
      if (!client) {
        logger.error(`Client not found for telegram_id: ${chatId}`);
        throw new Error(`Client not found for telegram_id: ${chatId}`);
      }
      
      // Отправляем сообщение
      await this.bot.sendMessage(client.telegram_id, message);
      
      // Сохраняем сообщение в базе данных
      await Message.create({
        client_id: client.id,
        message_content: message,
        is_from_bot: true,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      logger.info(`Message sent to client ${client.id} (telegram_id: ${client.telegram_id})`);
      return true;
    } catch (error) {
      logger.error(`Error sending message to chat ${chatId}:`, error);
      throw error;
    }
  }

  async stop() {
    try {
      if (this.bot) {
        await this.bot.stopPolling();
        logger.info('Bot stopped successfully');
      }
    } catch (error) {
      logger.error('Error stopping bot:', error);
      throw error;
    }
  }

  async handleClientMessage(msg) {
    try {
      const telegramId = msg.from.id.toString();
      
      logger.debug(`Обрабатываю сообщение от пользователя ID: ${telegramId}, username: ${msg.from.username || 'не указан'}`);
      
      // Get user's profile photos
      let photoUrl = null;
      try {
        if (this.token) {
          const photos = await this.bot.getUserProfilePhotos(msg.from.id, { limit: 1 });
          if (photos.total_count > 0) {
            const photo = photos.photos[0][0]; // Get the first (highest quality) photo
            const file = await this.bot.getFile(photo.file_id);
            photoUrl = `https://api.telegram.org/file/bot${this.token}/${file.file_path}`;
            logger.debug(`Получен URL фото для пользователя ${telegramId}: ${photoUrl}`);
          }
        } else {
          logger.warn(`Токен бота не найден для получения фото пользователя ${telegramId}`);
        }
      } catch (error) {
        logger.warn(`Не удалось получить фото профиля для пользователя ${telegramId}:`, error);
      }
      
      // Сначала пытаемся найти клиента по telegram_id
      let client = await Client.findOne({
        where: { telegram_id: telegramId }
      });
      
      let isNewClient = false;
      
      if (!client) {
        logger.debug(`Клиент не найден, создаем нового с ID Telegram: ${telegramId}`);
        
        // Создаем нового клиента
        client = await Client.create({
          telegram_id: telegramId,
          username: msg.from.username,
          first_name: msg.from.first_name,
          last_name: msg.from.last_name,
          photo_url: photoUrl,
          last_message_at: new Date(),
          language: null // Устанавливаем язык в null для новых клиентов
        });
        
        isNewClient = true;
        logger.info(`Создан новый клиент с ID: ${client.id}, Telegram ID: ${telegramId}`);
      } else {
        // Обновляем информацию о клиенте
        await client.update({
          username: msg.from.username,
          first_name: msg.from.first_name,
          last_name: msg.from.last_name,
          photo_url: photoUrl || client.photo_url, // Keep existing photo if new one couldn't be fetched
          last_message_at: new Date()
        });
      }
      
      // Проверяем, есть ли у клиента установленный язык
      if ((isNewClient || !client.language) && !this.clientSurveyState?.[client.id]) {
        // Если это новый клиент или у него не установлен язык, и он не находится в процессе опроса,
        // запускаем поток выбора языка
        logger.info(`Клиент ${client.id} не имеет установленного языка, запускаем поток выбора языка`);
        
        // Запускаем поток выбора языка асинхронно, чтобы не блокировать обработку сообщения
        setTimeout(() => {
          this.startLanguageSelectionFlow(msg.chat.id, client.id);
        }, 500);
      }
      
      return client;
    } catch (error) {
      logger.error('Error handling client message:', error);
      return null;
    }
  }

  async sendWelcomeMessage(chatId, clientId) {
    try {
      const welcomeText = 'Привет! Спасибо, что обратились к нам. Я бот компании "Интегратор". Прежде чем мы начнем работать с вашим запросом, пожалуйста, ответьте на несколько вопросов.';
      
      // Отправляем приветственное сообщение
      await this.bot.sendMessage(chatId, welcomeText);
      
      // Записываем сообщение бота в базу данных
      await Message.create({
        client_id: clientId,
        message_content: welcomeText,
        is_from_bot: true,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Запускаем опросник с небольшой задержкой
      setTimeout(() => this.startWelcomeSurvey(chatId, clientId), 1000);
      
    } catch (error) {
      logger.error('Error sending welcome message:', error);
    }
  }
  
  async startWelcomeSurvey(chatId, clientId) {
    try {
      // Здесь можно либо использовать существующий Flow из базы данных,
      // либо создать последовательность вопросов прямо в коде
      
      // Вариант 1: Найти Flow в базе данных и запустить его
      const welcomeFlow = await Flow.findOne({
        where: { isDefault: true }  // Используем flow, помеченный как default
      });
      
      if (welcomeFlow) {
        logger.info(`Starting default welcome flow for client ${clientId}`);
        await this.startFlow(chatId, clientId, welcomeFlow);
      } else {
        // Вариант 2: Создаем последовательность вопросов прямо в коде
        logger.info(`No default flow found, using hardcoded survey for client ${clientId}`);
        
        // Первый вопрос
        const question1 = 'Какая у вас компания?';
        await this.bot.sendMessage(chatId, question1);
        await Message.create({
          client_id: clientId,
          message_content: question1,
          is_from_bot: true,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        // Для последовательных вопросов нужно дождаться ответа
        // Обычно для этого используются состояния клиентов
        // Но для простого примера, мы можем использовать жестко закодированные вопросы
        
        // Создаем временное хранилище для клиентов в опроснике, если его нет
        if (!this.clientSurveyState) {
          this.clientSurveyState = {};
        }
        
        // Устанавливаем состояние для клиента
        this.clientSurveyState[clientId] = {
          step: 1,
          answers: {}
        };
      }
      
    } catch (error) {
      logger.error('Error starting welcome survey:', error);
    }
  }
  
  // Метод для запуска Flow
  async startFlow(chatId, clientId, flow) {
    try {
      logger.info(`Starting flow ${flow.id} for client ${clientId}`);
      
      // Проверяем, что у потока есть шаги
      if (!flow.flowSteps || flow.flowSteps.length === 0) {
        logger.warn(`Flow ${flow.id} has no steps`);
        await this.bot.sendMessage(chatId, 'This survey has no questions.');
        return false;
      }
      
      // Сортируем шаги по order_index
      const steps = [...flow.flowSteps].sort((a, b) => a.order_index - b.order_index);
      logger.debug(`Flow has ${steps.length} steps. First step: ${steps[0].id}, response_type: ${steps[0].response_type}, next_step_id: ${steps[0].next_step_id}`);
      
      // Получаем первый шаг
      const firstStep = steps[0];
      
      // Обновляем клиента в базе данных
      await Client.update(
        { current_flow_id: flow.id },
        { where: { id: clientId } }
      );
      
      // Инициализируем состояние опроса для клиента
      this.clientSurveyState[clientId] = {
        flowId: flow.id,
        flow: flow,
        currentStepIndex: 0,
        answers: {}
      };
      
      logger.debug(`Initialized survey state for client ${clientId}: flowId=${flow.id}, currentStepIndex=0`);
      
      // Отправляем первый шаг
      await this.sendFlowStep(chatId, clientId, firstStep, 1, steps.length);
      
      return true;
    } catch (error) {
      logger.error(`Error starting flow ${flow?.id} for client ${clientId}:`, error);
      return false;
    }
  }
  
  // Отправка сообщения для текущего шага flow
  async sendFlowStep(chatId, clientId, step, currentStep, totalSteps) {
    try {
      logger.info(`Sending flow step ${step.id} to client ${clientId}, response_type: ${step.response_type}, button_style: ${step.button_style || 'inline'}, next_step_id: ${step.next_step_id}`);
      
      // Форматируем сообщение с учетом прогресса
      let message = step.question;
      if (!step.config?.hide_step_counter && step.response_type !== 'final') {
        message = `Шаг ${currentStep} из ${totalSteps}\n\n${message}`;
      }
      
      const options = {
        parse_mode: 'HTML'
      };
      
      // Определяем стиль кнопок (inline или keyboard)
      const buttonStyle = step.button_style || 'inline';
      
      // Обрабатываем различные типы ответов
      switch (step.response_type) {
        case 'callback':
        case 'buttons':
          // Для кнопок с callback_data
          if (step.options && step.options.length > 0) {
            const buttons = step.options.map(option => ({
              text: option.text,
              callback_data: JSON.stringify({
                action: 'flow_response',
                step_id: step.id,
                value: option.value
              })
            }));
            
            if (buttonStyle === 'inline') {
              // Группируем кнопки по 2 в ряд для inline кнопок
              const keyboard = [];
              for (let i = 0; i < buttons.length; i += 2) {
                keyboard.push(buttons.slice(i, i + 2));
              }
              
              options.reply_markup = {
                inline_keyboard: keyboard
              };
            } else if (buttonStyle === 'keyboard') {
              // Для обычной клавиатуры используем текст кнопок
              const keyboardButtons = step.options.map(option => option.text);
              
              // Группируем кнопки по 2 в ряд
              const keyboard = [];
              for (let i = 0; i < keyboardButtons.length; i += 2) {
                keyboard.push(keyboardButtons.slice(i, i + 2));
              }
              
              options.reply_markup = {
                keyboard: keyboard,
                resize_keyboard: true,
                one_time_keyboard: true
              };
            }
          }
          break;
          
        case 'url':
          // Для кнопок с URL
          if (step.options && step.options.length > 0) {
            const buttons = step.options.map(option => ({
              text: option.text,
              url: option.url || option.value
            }));
            
            if (buttonStyle === 'inline') {
              // Группируем кнопки по 2 в ряд
              const keyboard = [];
              for (let i = 0; i < buttons.length; i += 2) {
                keyboard.push(buttons.slice(i, i + 2));
              }
              
              options.reply_markup = {
                inline_keyboard: keyboard
              };
            } else if (buttonStyle === 'keyboard') {
              // Для обычной клавиатуры URL не поддерживаются, используем текст
              const keyboardButtons = step.options.map(option => option.text);
              
              // Группируем кнопки по 2 в ряд
              const keyboard = [];
              for (let i = 0; i < keyboardButtons.length; i += 2) {
                keyboard.push(keyboardButtons.slice(i, i + 2));
              }
              
              options.reply_markup = {
                keyboard: keyboard,
                resize_keyboard: true,
                one_time_keyboard: true
              };
              
              // Добавляем предупреждение в лог
              logger.warn(`URL buttons with keyboard style for step ${step.id}. URLs will not be clickable.`);
            }
          }
          break;
          
        case 'nextStep':
          // Для кнопки "Далее"
          if (buttonStyle === 'inline') {
            options.reply_markup = {
              inline_keyboard: [
                [
                  {
                    text: 'Next ➡️',
                    callback_data: JSON.stringify({
                      action: 'flow_response',
                      step_id: step.id,
                      value: 'next'
                    })
                  }
                ]
              ]
            };
          } else if (buttonStyle === 'keyboard') {
            options.reply_markup = {
              keyboard: [['Next ➡️']],
              resize_keyboard: true,
              one_time_keyboard: true
            };
          }
          break;
          
        case 'keyboard':
          // Для обычной клавиатуры (не inline)
          if (step.options && step.options.length > 0) {
            const buttons = step.options.map(option => option.text);
            
            // Группируем кнопки по 2 в ряд
            const keyboard = [];
            for (let i = 0; i < buttons.length; i += 2) {
              keyboard.push(buttons.slice(i, i + 2));
            }
            
            // Всегда используем обычную клавиатуру для этого типа, независимо от button_style
            options.reply_markup = {
              keyboard: keyboard,
              resize_keyboard: true,
              one_time_keyboard: true
            };
            
            // Если указан inline стиль, добавляем предупреждение в лог
            if (buttonStyle === 'inline') {
              logger.warn(`Keyboard response type with inline button style for step ${step.id}. Using keyboard style instead.`);
            }
          }
          break;
          
        case 'text':
        case 'final':
        default:
          // Для текстовых ответов не добавляем клавиатуру
          break;
      }
      
      // Отправляем сообщение
      const sentMessage = await this.bot.sendMessage(chatId, message, options);
      
      // Сохраняем сообщение в базе данных
      await Message.create({
        client_id: clientId,
        message_content: message,
        is_from_bot: true,
        telegram_message_id: sentMessage.message_id.toString(),
        flow_id: step.flow_id,
        flow_step_id: step.id,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      logger.info(`Flow step ${step.id} sent to client ${clientId}`);
    } catch (error) {
      logger.error(`Error sending flow step ${step.id} to client ${clientId}:`, error);
    }
  }
  
  // Вспомогательный метод для получения клавиатуры в зависимости от типа шага
  getKeyboardMarkup(step) {
    try {
      // Если шаг не имеет кнопок или responseType не указан, возвращаем null
      if (!step || (!step.buttons && !step.responseType)) {
        logger.debug(`Step has no buttons and no responseType, returning null`);
        return null;
      }
      
      // Получаем кнопки из шага
      let buttons = step.buttons || [];
      
      // Определяем стиль кнопок (inline или keyboard)
      const buttonStyle = step.button_style || 'inline';
      
      // Логика по типу ожидаемого ответа
      switch (step.responseType) {
        case 'keyboard':
          // Для keyboard типа всегда используем обычную клавиатуру
          return this.formatReplyKeyboard(buttons);
        
        case 'callback':
          // Для callback типа используем стиль из настроек
          if (buttonStyle === 'keyboard') {
            return this.formatReplyKeyboard(buttons);
          }
          return this.formatInlineKeyboard(buttons);
        
        case 'url':
          // Для URL типа используем стиль из настроек, но URL работают только с inline
          if (buttonStyle === 'keyboard') {
            logger.warn(`URL buttons with keyboard style. URLs will not be clickable.`);
            return this.formatReplyKeyboard(buttons);
          }
          return this.formatUrlKeyboard(buttons);
        
        case 'text':
        default:
          // Для текстового типа ответа, просто добавляем кнопку "Далее"
          if (buttons.length === 0) {
            buttons.push({
              text: 'Next ➡️',
              action: 'next_step',
              value: 'next'
            });
          }
          
          // Используем стиль из настроек
          if (buttonStyle === 'keyboard') {
            return this.formatReplyKeyboard(buttons);
          }
          return this.formatInlineKeyboard(buttons);
      }
    } catch (error) {
      logger.error(`Error getting keyboard markup: ${error.message}`);
      return null;
    }
  }
  
  // Метод для обработки ответов на вопросы опросника
  async handleSurveyResponse(msg, client) {
    try {
      if (!this.clientSurveyState || !this.clientSurveyState[client.id]) {
        logger.debug(`No active flow state for client ${client.id}`);
        return false;
      }
      
      const state = this.clientSurveyState[client.id];
      const chatId = msg.chat.id;
      
      // Если это Flow из базы данных
      if (client.current_flow_id && state.flowId) {
        logger.debug(`Processing survey response from client ${client.id} for flow ${client.current_flow_id}`);
        
        // Проверяем, что IDs совпадают
        if (client.current_flow_id !== state.flowId) {
          logger.warn(`Flow ID mismatch: client has ${client.current_flow_id}, state has ${state.flowId}`);
          
          // Обновляем flowId в состоянии
          state.flowId = client.current_flow_id;
          this.clientSurveyState[client.id] = state;
        }
        
        // Получаем flow из базы данных с шагами
        const flow = await Flow.findByPk(state.flowId, {
          include: [{ model: Step, as: 'flowSteps' }]
        });
        
        if (!flow || !flow.flowSteps || flow.flowSteps.length === 0) {
          logger.warn(`Flow ${state.flowId} not found or has no steps for client ${client.id}`);
          return false;
        }
        
        // Сортируем шаги по order_index
        const steps = [...flow.flowSteps].sort((a, b) => a.order_index - b.order_index);
        
        // Получаем текущий шаг
        const currentStepIndex = state.currentStepIndex;
        
        if (currentStepIndex >= steps.length) {
          logger.warn(`Invalid step index ${currentStepIndex} for flow ${state.flowId} with ${steps.length} steps`);
          return false;
        }
        
        const currentStep = steps[currentStepIndex];
        logger.debug(`Processing response for step ${currentStep.id} (index ${currentStepIndex}): ${msg.text}`);
        
        // Сохраняем ответ пользователя
        const stepKey = `step_${currentStep.id}`;
        state.answers[stepKey] = msg.text;
        
        // Сохраняем сообщение от пользователя в базу данных
        try {
          await Message.create({
            client_id: client.id,
            message_content: msg.text,
            is_from_bot: false,
            telegram_message_id: msg.message_id.toString(),
            flow_id: state.flowId,
            flow_step_id: currentStep.id,
            created_at: new Date(),
            updated_at: new Date()
          });
        } catch (error) {
          logger.error(`Error saving client message: ${error.message}`);
        }
        
        // Определяем следующий шаг
        let nextStep = null;
        
        // Если у текущего шага есть nextStepId, используем его
        if (currentStep.nextStepId) {
          nextStep = steps.find(step => step.id === parseInt(currentStep.nextStepId));
        } 
        // Если шаг финальный, завершаем опрос
        else if (currentStep.isFinal) {
          // Генерируем результат опроса
          await this.generateFlowResult(chatId, client.id, flow);
          
          // Удаляем состояние опроса
          delete this.clientSurveyState[client.id];
          
          // Обновляем клиента в базе данных
          await Client.update(
            { current_flow_id: null },
            { where: { id: client.id } }
          );
          
          logger.info(`Flow ${state.flowId} completed for client ${client.id}`);
        return true;
        } 
        // Иначе берем следующий шаг по порядку
        else {
          const currentIndex = steps.findIndex(step => step.id === currentStep.id);
          if (currentIndex < steps.length - 1) {
            nextStep = steps[currentIndex + 1];
          }
        }
        
        // Если следующий шаг найден, отправляем его
        if (nextStep) {
          // Обновляем текущий индекс шага в состоянии
          state.currentStepIndex = steps.findIndex(step => step.id === nextStep.id);
          
          // Отправляем следующий шаг
          await this.sendFlowStep(chatId, client.id, nextStep, state.currentStepIndex + 1, steps.length);
          return true;
        } else {
          // Если следующий шаг не найден, завершаем опрос без сообщения
          logger.debug(`No next step found, completing flow silently`);
          // await this.bot.sendMessage(chatId, 'Survey completed. Thank you for your responses!');
          
          // Удаляем состояние опроса
          delete this.clientSurveyState[client.id];
          
          // Обновляем клиента в базе данных
          await Client.update(
            { current_flow_id: null },
            { where: { id: client.id } }
          );
          
          logger.info(`Flow ${state.flowId} completed for client ${client.id} (no next step found)`);
          return true;
        }
      }
      
      // Для обратной совместимости с другими типами опросов (не из базы данных)
      return false;
    } catch (error) {
      logger.error(`Error handling survey response: ${error.message}`);
      return false;
    }
  }
  
  // Метод для проверки условия
  checkCondition(condition, value) {
    try {
      switch (condition.type) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return value.includes(condition.value);
        case 'startsWith':
          return value.startsWith(condition.value);
        case 'endsWith':
          return value.endsWith(condition.value);
        case 'regex':
          return new RegExp(condition.value).test(value);
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Error checking condition: ${error.message}`);
      return false;
    }
  }
  
  async handleBotResponse(clientId, msg, response) {
    try {
      await Message.create({
        client_id: clientId,
        message_content: response,
        is_from_bot: true,
        telegram_message_id: msg.message_id.toString(),
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      logger.error('Error saving bot response:', error);
      // Не бросаем ошибку, чтобы бот продолжал работать
      return null;
    }
  }

  // Метод для обработки ответа пользователя в рамках Flow
  async processFlowResponse(chatId, clientId, message) {
    try {
      logger.debug(`Processing flow response from client ${clientId} in chat ${chatId}: ${message.text || message.data}`);
      
      // Проверяем, находится ли клиент в процессе опроса
      if (!this.clientSurveyState || !this.clientSurveyState[clientId]) {
        logger.debug(`Client ${clientId} is not in an active flow`);
        return false;
      }
      
      const clientState = this.clientSurveyState[clientId];
      const flowId = clientState.flowId;
      
      // Получаем flow из базы данных с шагами
      const flow = await Flow.findByPk(flowId, {
        include: [{ model: Step, as: 'flowSteps' }]
      });
      
      if (!flow || !flow.flowSteps || flow.flowSteps.length === 0) {
        logger.warn(`Flow ${flowId} not found or has no steps for client ${clientId}`);
        return false;
      }
      
      // Сортируем шаги по order_index
      const steps = [...flow.flowSteps].sort((a, b) => a.order_index - b.order_index);
      
      // Сохраняем отсортированные шаги в состоянии
      if (!clientState.flow) {
        clientState.flow = flow;
      }
      
      // Получаем текущий шаг
      const currentStepIndex = clientState.currentStepIndex;
      
      if (currentStepIndex >= steps.length) {
        logger.warn(`Invalid step index ${currentStepIndex} for flow ${flowId} with ${steps.length} steps`);
        return false;
      }
      
      const currentStep = steps[currentStepIndex];
      logger.debug(`Processing response for step ${currentStep.id} (index ${currentStepIndex}): ${message.text || message.data}`);
      
      // Сохраняем ответ пользователя с ключом, соответствующим ID шага
      const stepKey = `step_${currentStep.id}`;
      clientState.answers[stepKey] = message.text || message.data;
      
      // Сохраняем сообщение от пользователя в базу данных
      try {
        await Message.create({
          client_id: clientId,
          message_content: message.text || message.data,
          is_from_bot: false,
          telegram_message_id: message.message_id?.toString(),
          flow_id: flowId,
          response_to_step_id: currentStep.id
        });
        logger.debug(`Saved user message for step ${currentStep.id}`);
      } catch (error) {
        logger.error('Error saving user message:', error);
      }
      
      // Определяем следующий шаг
      let nextStepIndex = currentStepIndex + 1;
      
      // Если не последний шаг, проверяем условия перехода для следующих шагов
      if (nextStepIndex < steps.length) {
        const userAnswer = message.text || message.data;
        
        // Проверяем все шаги на наличие условий для перехода
        for (let i = 0; i < steps.length; i++) {
          // Пропускаем шаги до текущего (включительно)
          if (i <= currentStepIndex) continue;
          
          const step = steps[i];
          
          // Проверяем, есть ли у этого шага условия для перехода
          if (step.conditions && step.conditions.prevStepId === currentStep.id) {
            // Проверяем ответ пользователя на соответствие условиям
            let conditionsMet = false;
            
            if (step.conditions.answers && step.conditions.answers.length > 0) {
              for (const condition of step.conditions.answers) {
                if (this.checkCondition(condition, userAnswer)) {
                  conditionsMet = true;
              break;
                }
              }
              
              // Если условия выполнены, устанавливаем этот шаг как следующий
              if (conditionsMet) {
                nextStepIndex = i;
                logger.debug(`Условие выполнено, переходим к шагу ${step.id} (index ${i})`);
              break;
            }
          }
        }
        }
      }
      
      // Обновляем индекс текущего шага в состоянии клиента
      clientState.currentStepIndex = nextStepIndex;
      
      // Если это был последний шаг, завершаем опрос
      if (nextStepIndex >= steps.length) {
        logger.info(`Flow ${flowId} completed for client ${clientId}`);
        
        // Очищаем состояние клиента
        delete this.clientSurveyState[clientId];
        
        // Обновляем клиента в базе данных
        const client = await Client.findByPk(clientId);
        if (client) {
          await client.update({
            current_flow_id: null,
            flow_data: null
          });
        }
        
        // Отправляем сообщение о завершении опроса
        await this.bot.sendMessage(chatId, 'Спасибо за ваши ответы! Опрос завершен.');
        
        // Сохраняем результаты опроса
        await this.generateFlowResult(chatId, clientId, flow);
        
        return true;
      }
      
      // Отправляем следующий шаг
      await this.sendFlowStep(chatId, clientId, steps[nextStepIndex], nextStepIndex + 1, steps.length);
      
      return true;
    } catch (error) {
      logger.error(`Error processing flow response: ${error.message}`, error);
      return false;
    }
  }
  
  // Метод для генерации результата опросника
  async generateFlowResult(chatId, clientId, flow) {
    try {
      logger.info(`Generating flow result for client ${clientId} in chat ${chatId}`);
      
      if (!this.clientSurveyState || !this.clientSurveyState[clientId]) {
        logger.warn(`No survey state found for client ${clientId}`);
        return;
      }
      
      const clientState = this.clientSurveyState[clientId];
      const answers = clientState.answers;
      
      // Формируем базовое сообщение с результатами
      let resultMessage = `Спасибо за прохождение опросника "${flow.name}"!\n\n`;
      resultMessage += `Ваши ответы:\n`;
      
      // Добавляем все ответы
      const steps = flow.steps || [];
      Object.keys(answers).forEach(stepIndex => {
        const step = steps[parseInt(stepIndex) - 1];
        if (step) {
          resultMessage += `${stepIndex}. ${step.title || `Вопрос ${stepIndex}`}: ${answers[stepIndex]}\n`;
        }
      });
      
      // Пример логики формирования рекомендации на основе ответов
      let recommendation = '';
      
      // Простой пример логики (можно расширить в зависимости от требований)
      if (answers[2] && answers[2].includes('18-25')) {
        recommendation = 'Рекомендация для молодой аудитории';
      } else if (answers[2] && answers[2].includes('26-35')) {
        recommendation = 'Рекомендация для аудитории среднего возраста';
      } else {
        recommendation = 'Общая рекомендация';
      }
      
      resultMessage += `\nНа основе ваших ответов, мы рекомендуем:\n${recommendation}`;
      
      // Отправляем результат
      await this.bot.sendMessage(chatId, resultMessage);
      
      // Сохраняем результат в базе данных
      await Message.create({
        client_id: clientId,
        message_content: resultMessage,
        is_from_bot: true,
        metadata: {
          type: 'flow_result',
          flow_id: flow.id,
          answers
        },
        created_at: new Date(),
        updated_at: new Date()
      });
      
      logger.info(`Flow result sent to client ${clientId}`);
    } catch (error) {
      logger.error(`Error generating flow result for client ${clientId}:`, error);
    }
  }

  // Метод для обновления flows в боте
  async refreshFlows() {
    try {
      logger.info('Refreshing flows in bot service...');
      
      // Получаем все активные flows из базы данных
      const flows = await Flow.findAll({
        where: {
          is_active: true
        },
        include: [
          {
            model: Command,
            as: 'commands'
          },
          {
            model: Step,
            as: 'flowSteps'
          }
        ]
      });
      
      logger.info(`Found ${flows.length} active flows`);
      
      // Обновляем обработчики команд для flows
      for (const flow of flows) {
        // Подготавливаем flow с корректными шагами
        const flowData = flow.toJSON();
        flowData.steps = flowData.flowSteps || [];
        delete flowData.flowSteps;
        
        // Сортируем шаги по order_index
        if (flowData.steps && flowData.steps.length > 0) {
          flowData.steps.sort((a, b) => a.order_index - b.order_index);
          logger.info(`Flow ${flow.id} has ${flowData.steps.length} steps`);
        } else {
          // Если шаги не были загружены, загрузим их отдельно
          try {
            const steps = await Step.findAll({
              where: { flow_id: flow.id },
              order: [['order_index', 'ASC']]
            });
            
            if (steps && steps.length > 0) {
              flowData.steps = steps.map(step => step.toJSON());
              logger.info(`Loaded ${steps.length} steps for flow ${flow.id}`);
            } else {
              logger.warn(`Flow ${flow.id} has no steps in the database`);
            }
          } catch (stepsError) {
            logger.error(`Error loading steps for flow ${flow.id}:`, stepsError);
          }
        }
        
        if (flow.commands) {
          const commandText = flow.commands.command;
          logger.info(`Setting up handler for flow ${flow.id} with command ${commandText}`);
          
          // Убедимся, что команда существует и активна
          const existingCommand = this.commands.find(cmd => 
            cmd.command === commandText
          );
          
          if (!existingCommand) {
            logger.info(`Adding command ${commandText} to the commands list for flow ${flow.id}`);
            this.commands.push({
              id: flow.commands.id,
              command: commandText,
              description: flow.commands.description || `Command for flow: ${flow.name}`,
              response: flow.commands.response || 'Starting flow...',
              type: 'slash',
              isActive: true
            });
          }
          
          // Если это не команда /start (которая обрабатывается отдельно для поддержки дефолтных flows),
          // регистрируем обработчик
          if (commandText && commandText !== '/start') {
            // Создаем регулярное выражение для команды
            const commandPattern = commandText.startsWith('/') ? 
              commandText : `/${commandText}`;
            
            const regex = new RegExp(`^${commandPattern}$`);
            
            // Регистрируем обработчик для команды, запускающей flow
            this.bot.onText(regex, async (msg) => {
              try {
                const chatId = msg.chat.id;
                logger.info(`Flow command ${commandPattern} triggered by user ${msg.from.id} in chat ${chatId}`);
                
                // Обрабатываем сообщение и получаем/создаем клиента
                const client = await this.handleClientMessage(msg);
                
                if (!client) {
                  logger.warn(`Cannot start flow: client not found for chat ${chatId}`);
                  await this.bot.sendMessage(chatId, 'Извините, не удалось запустить опросник. Пожалуйста, попробуйте позже.');
                  return;
                }
                
                // Запускаем flow для клиента
                await this.startFlow(chatId, client.id, flow);
              } catch (error) {
                logger.error(`Error handling flow command ${commandPattern}:`, error);
                try {
                  await this.bot.sendMessage(msg.chat.id, 'Извините, произошла ошибка при запуске опросника. Пожалуйста, попробуйте позже.');
                } catch (sendError) {
                  logger.error(`Failed to send error message to chat ${msg.chat.id}:`, sendError);
                }
              }
            });
            
            logger.info(`Handler for flow command ${commandText} registered successfully`);
          } else {
            logger.info(`Flow ${flow.id} is linked to /start command, will be handled by start command handler`);
          }
        } else if (flow.isDefault) {
          logger.info(`Flow ${flow.id} is marked as default but has no start command - it will trigger on /start`);
        } else {
          logger.warn(`Flow ${flow.id} has no start command defined and is not default - it cannot be triggered`);
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error refreshing flows:', error);
      return false;
    }
  }

  // Метод для отправки приглашения пройти опросник
  async sendFlowInvitation(chatId, flowId, message = null) {
    try {
      logger.info(`Sending flow invitation to chat ${chatId} for flow ${flowId}`);
      
      // Если передан telegram_id вместо chatId, найдем клиента
      let client;
      let clientId;
      
      if (isNaN(chatId)) {
        // Это telegram_id, найдем клиента
        client = await Client.findOne({
          where: { telegram_id: chatId }
        });
        
        if (!client) {
          logger.warn(`Cannot send invitation: client with telegram_id ${chatId} not found`);
          return false;
        }
        
        clientId = client.id;
        chatId = client.telegram_id;
      } else {
        // Это уже chatId, найдем клиента по нему
        client = await Client.findOne({
          where: { telegram_id: chatId.toString() }
        });
        
        if (!client) {
          logger.warn(`Cannot send invitation: client with chat_id ${chatId} not found`);
          return false;
        }
        
        clientId = client.id;
      }
      
      // Получаем информацию о потоке без включения steps
      const flow = await Flow.findByPk(flowId);
      
      if (!flow) {
        logger.warn(`Cannot send invitation: flow ${flowId} not found`);
        return false;
      }
      
      // Отдельно получаем шаги
      const steps = await Step.findAll({
        where: { flow_id: flowId },
        order: [['order_index', 'ASC']]
      });
      
      // Подсчитываем количество вопросов в потоке
      const questionsCount = steps ? steps.length : 0;
      
      // Формируем приглашение
      const defaultMessage = `📋 Приглашаем вас пройти опрос "${flow.name}".\n\nКоличество вопросов: ${questionsCount}\n\nНажмите "Начать опрос", чтобы приступить к прохождению.`;
      const invitationMessage = message || defaultMessage;
      
      // Формируем кнопки
      // Кнопки определены напрямую в reply_markup ниже
      
      // Отправляем сообщение с кнопками
      const sentMessage = await this.bot.sendMessage(chatId, invitationMessage, {
        reply_markup: {
          inline_keyboard: [[
            { 
              text: '✅ Начать опрос', 
              callback_data: JSON.stringify({ action: 'start_flow', value: flowId.toString() }) 
            },
            { 
              text: '❌ Отказаться', 
              callback_data: JSON.stringify({ action: 'decline_flow', value: 'decline' }) 
            }
          ]]
        }
      });
      
      // Сохраняем сообщение в базе данных
      await Message.create({
        client_id: clientId,
        message_content: invitationMessage,
        is_from_bot: true,
        telegram_message_id: sentMessage.message_id.toString(),
        created_at: new Date(),
        updated_at: new Date()
      });
      
      logger.info(`Flow invitation sent to client ${clientId} for flow ${flowId}`);
      return true;
    } catch (error) {
      logger.error(`Error sending flow invitation to chat ${chatId} for flow ${flowId}:`, error);
      return false;
    }
  }

  // Метод для обработки специальных команд с действиями
  async handleSpecialCommands(msg) {
    try {
      const chatId = msg.chat.id;
      const text = msg.text || '';
      
      // Если сообщение не содержит команду, пропускаем
      if (!text.startsWith('/')) {
        return false;
      }
      
      // Извлекаем имя команды без слэша и без параметров
      const commandPattern = text.split(' ')[0];
      const commandName = commandPattern.substring(1).toLowerCase();
      
      logger.info(`Flow command ${commandPattern} triggered by user ${msg.from.id} in chat ${chatId}`);
      
      // Обрабатываем команду /cancel для отмены текущего потока
      if (commandName === 'cancel') {
      // Находим клиента
        const telegramId = msg.from.id.toString();
        const client = await Client.findOne({
          where: { telegram_id: telegramId }
        });
      
      if (!client) {
          logger.warn(`Client not found for telegram ID ${telegramId}`);
        return false;
      }
      
        // Проверяем, находится ли клиент в процессе опроса
        if (this.clientSurveyState && this.clientSurveyState[client.id]) {
          // Удаляем состояние опроса
          delete this.clientSurveyState[client.id];
          
          // Обновляем клиента в базе данных
          await Client.update(
            { current_flow_id: null },
            { where: { id: client.id } }
          );
          
          // Отправляем сообщение об отмене опроса
          await this.bot.sendMessage(chatId, 'Survey cancelled. You can start a new one at any time.');
          
          logger.info(`Flow cancelled for client ${client.id}`);
            return true;
        }
      }
      
      // Находим команду в базе данных или в локальном списке
      let command = await Command.findOne({
        where: {
          name: commandPattern,
          is_active: true
        }
      });
      
      // Если команда не найдена в базе данных, ищем в локальном списке
      if (!command && this.commands) {
        const localCommand = this.commands.find(cmd => 
          cmd.command === commandPattern && cmd.isActive
        );
        
        if (localCommand) {
          // Отправляем ответ на команду
          await this.bot.sendMessage(chatId, localCommand.response);
      
      // Находим клиента
          const telegramId = msg.from.id.toString();
          const client = await Client.findOne({
            where: { telegram_id: telegramId }
          });
          
          if (client) {
            // Сохраняем сообщение бота в базу данных
            await this.handleBotResponse(client.id, msg, localCommand.response);
          }
          
          logger.info(`Command ${commandPattern} processed from local list`);
            return true;
          }
      } else if (command) {
        // Отправляем ответ на команду из базы данных
        await this.bot.sendMessage(chatId, command.response);
        
        // Находим клиента
        const telegramId = msg.from.id.toString();
        const client = await Client.findOne({
          where: { telegram_id: telegramId }
        });
        
        if (client) {
          // Сохраняем сообщение бота в базу данных
          await this.handleBotResponse(client.id, msg, command.response);
        }
        
        logger.info(`Command ${commandPattern} processed from database`);
            return true;
          }
      
      // Если команда не найдена, возвращаем false
      return false;
    } catch (error) {
      logger.error('Error handling special commands:', error);
        return false;
    }
  }

  // Метод для обработки ответа на шаг flow
  async handleFlowResponse(chatId, clientId, stepId, value) {
    try {
      logger.info(`Handling flow response for client ${clientId}, step ${stepId}, value: ${value}`);
      
      // Проверяем, находится ли клиент в процессе опроса
      if (!this.clientSurveyState || !this.clientSurveyState[clientId]) {
        logger.warn(`No active flow state for client ${clientId}`);
        return false;
      }
      
      const clientState = this.clientSurveyState[clientId];
      const flowId = clientState.flowId;
      
      logger.debug(`Client state found: flowId=${flowId}, currentStepIndex=${clientState.currentStepIndex}`);
      
      // Получаем flow из базы данных с шагами
      const flow = await Flow.findByPk(flowId, {
        include: [{ model: Step, as: 'flowSteps' }]
      });
      
      if (!flow || !flow.flowSteps || flow.flowSteps.length === 0) {
        logger.warn(`Flow ${flowId} not found or has no steps for client ${clientId}`);
        return false;
      }
      
      // Проверяем, является ли это потоком выбора языка
      if (flow.name === 'Language Selection') {
        logger.info(`Processing language selection for client ${clientId}: ${value}`);
        
        // Обрабатываем выбор языка
        await this.handleLanguageSelection(chatId, clientId, value);
        
        // Удаляем состояние опроса
        delete this.clientSurveyState[clientId];
        
        // Обновляем клиента в базе данных
        await Client.update(
          { current_flow_id: null },
          { where: { id: clientId } }
        );
        
        // Запускаем дефолтный поток после выбора языка
        const defaultFlow = await Flow.findOne({
          where: { is_default: true },
          include: [{ model: Step, as: 'flowSteps' }]
        });
        
        if (defaultFlow) {
          logger.info(`Starting default flow after language selection for client ${clientId}`);
          setTimeout(() => {
            this.startFlow(chatId, clientId, defaultFlow);
          }, 1000);
        }
            
            return true;
      }
      
      // Сортируем шаги по order_index
      const steps = [...flow.flowSteps].sort((a, b) => a.order_index - b.order_index);
      logger.debug(`Flow has ${steps.length} steps`);
      
      // Находим текущий шаг по ID
      const currentStep = steps.find(step => step.id === parseInt(stepId));
      if (!currentStep) {
        logger.warn(`Step ${stepId} not found in flow ${flowId}`);
        return false;
      }
      
      logger.debug(`Current step found: id=${currentStep.id}, response_type=${currentStep.response_type}, nextStepId=${currentStep.next_step_id}, isFinal=${currentStep.isFinal}`);
      
      // Сохраняем ответ пользователя
      const stepKey = `step_${currentStep.id}`;
      clientState.answers[stepKey] = value;
      
      // Сохраняем сообщение от пользователя в базу данных
      try {
        await Message.create({
          client_id: clientId,
          message_content: value,
          is_from_bot: false,
          flow_id: flowId,
          flow_step_id: currentStep.id,
          created_at: new Date(),
          updated_at: new Date()
      });
    } catch (error) {
        logger.error(`Error saving client message: ${error.message}`);
      }
      
      // Определяем следующий шаг
      let nextStep = null;
      
      // Если у текущего шага есть next_step_id, используем его
      if (currentStep.next_step_id) {
        logger.debug(`Looking for next step with id=${currentStep.next_step_id}`);
        nextStep = steps.find(step => step.id === parseInt(currentStep.next_step_id));
        if (nextStep) {
          logger.debug(`Found next step by next_step_id: ${nextStep.id}`);
          } else {
          logger.warn(`Next step with id=${currentStep.next_step_id} not found`);
        }
      } 
      // Если шаг финальный, завершаем опрос
      else if (currentStep.isFinal) {
        logger.debug(`Current step is final, completing flow`);
        // Генерируем результат опроса
        // await this.generateFlowResult(chatId, clientId, flow);
        
        // Удаляем состояние опроса
        delete this.clientSurveyState[clientId];
        
        // Обновляем клиента в базе данных
        await Client.update(
          { current_flow_id: null },
          { where: { id: clientId } }
        );
        
        logger.info(`Flow ${flowId} completed for client ${clientId}`);
            return true;
          }
      // Иначе берем следующий шаг по порядку
      else {
        const currentIndex = steps.findIndex(step => step.id === currentStep.id);
        logger.debug(`Current step index in array: ${currentIndex}, total steps: ${steps.length}`);
        
        if (currentIndex < steps.length - 1) {
          nextStep = steps[currentIndex + 1];
          logger.debug(`Found next step by order: ${nextStep.id}`);
        } else {
          logger.debug(`No next step by order, this is the last step`);
        }
      }
      
      // Если следующий шаг найден, отправляем его
      if (nextStep) {
        // Обновляем текущий индекс шага в состоянии
        clientState.currentStepIndex = steps.findIndex(step => step.id === nextStep.id);
        logger.debug(`Updating currentStepIndex to ${clientState.currentStepIndex}`);
        
        // Отправляем следующий шаг
        await this.sendFlowStep(chatId, clientId, nextStep, clientState.currentStepIndex + 1, steps.length);
        return true;
      } else {
        // Если следующий шаг не найден, завершаем опрос без сообщения
        logger.debug(`No next step found, completing flow silently`);
        // await this.bot.sendMessage(chatId, 'Survey completed. Thank you for your responses!');
        
        // Удаляем состояние опроса
        delete this.clientSurveyState[clientId];
        
        // Обновляем клиента в базе данных
        await Client.update(
          { current_flow_id: null },
          { where: { id: clientId } }
        );
        
        logger.info(`Flow ${flowId} completed for client ${clientId} (no next step found)`);
              return true;
      }
    } catch (error) {
      logger.error(`Error handling flow response: ${error.message}`);
      return false;
    }
  }

  // Метод для установки обработчиков событий
  setupEventHandlers() {
    // Обработка ошибок
    this.bot.on('error', (error) => {
      logger.error('Bot error:', error);
    });

    // Обработка ошибок при поллинге
    this.bot.on('polling_error', (error) => {
      logger.error('Polling error:', error);
      // Пытаемся перезапустить поллинг после ошибки
      setTimeout(() => {
        try {
          this.bot.stopPolling();
          this.bot.startPolling();
          logger.info('Polling restarted after error');
        } catch (e) {
          logger.error('Failed to restart polling:', e);
        }
      }, 5000);
    });

    // Обработка ошибок вебхука
    this.bot.on('webhook_error', (error) => {
      logger.error('Webhook error:', error);
    });

    // Handle all other messages
    this.bot.on('message', async (msg) => {
      try {
        // Обрабатываем специальные команды
        if (msg.text && msg.text.startsWith('/')) {
          const handled = await this.handleSpecialCommands(msg);
          if (handled) {
            logger.info(`Special command handled: ${msg.text}`);
            return;
          }
          
          // Если команда не обработана специальным обработчиком, продолжаем обычную обработку
          const client = await this.handleClientMessage(msg);
          
          // Если клиент не был создан успешно, прерываем обработку
          if (!client) {
            logger.warn(`Cannot process command: client not found for chat ${msg.chat.id}`);
            return;
          }
          
          // Сохраняем сообщение клиента в базу данных
          await Message.create({
            client_id: client.id,
            message_content: msg.text,
            is_from_bot: false,
            telegram_message_id: msg.message_id.toString(),
            created_at: new Date(),
            updated_at: new Date()
          });
          
          // Проверяем, есть ли команда в списке команд
          const command = this.matchCommand(msg);
          if (command && command.isActive) {
            logger.info(`Found matching command: ${command.command} (Active: ${command.isActive})`);
            await this.bot.sendMessage(msg.chat.id, command.response);
            await this.handleBotResponse(client.id, msg, command.response);
            } else {
            logger.info(`No matching command found for: ${msg.text}`);
          }
          
          return;
        }
        
        if (msg.text) {
          logger.info(`Received message from ${msg.chat.id}: ${msg.text}`);
          const client = await this.handleClientMessage(msg);
          
          // Если клиент не был создан успешно, прерываем обработку
          if (!client) {
            logger.warn(`Cannot process message: client not found for chat ${msg.chat.id}`);
            return;
          }

          // Сохраняем сообщение клиента в базу данных
          await Message.create({
            client_id: client.id,
            message_content: msg.text,
            is_from_bot: false,
            telegram_message_id: msg.message_id.toString(),
            created_at: new Date(),
            updated_at: new Date()
          });

          // Проверяем статус диалога
          if (!client.is_dialog_open) {
            // Если диалог закрыт, отправляем автоматическое сообщение
            const autoResponse = 'В данный момент диалог закрыт. Пожалуйста, дождитесь, когда оператор откроет диалог для продолжения общения.';
            await this.bot.sendMessage(msg.chat.id, autoResponse);
            await Message.create({
              client_id: client.id,
              message_content: autoResponse,
              is_from_bot: true,
              created_at: new Date(),
              updated_at: new Date()
            });
            return;
          }
          
          // Если клиент находится в процессе опросника, обрабатываем ответ
          if (client.current_flow_id && this.clientSurveyState && this.clientSurveyState[client.id]) {
            await this.handleSurveyResponse(msg, client);
            return; // Прерываем обработку, чтобы не отвечать другими командами
          }
          
          const command = this.matchCommand(msg);
          if (command && command.isActive) {
            logger.info(`Found matching command: ${command.command} (Active: ${command.isActive})`);
            await this.bot.sendMessage(msg.chat.id, command.response);
            await this.handleBotResponse(client.id, msg, command.response);
          }
        }
      } catch (error) {
        logger.error('Error handling message:', error);
      }
    });

    // Handle callback_query (нажатия на inline кнопки)
    this.bot.on('callback_query', async (callbackQuery) => {
      try {
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;
        
        // Получаем данные из callback_data
        let data;
        try {
          data = JSON.parse(callbackQuery.data);
          logger.debug(`Received callback query: ${JSON.stringify(data)}`);
        } catch (e) {
          logger.error('Error parsing callback data:', e);
          return;
        }
        
        // Получаем клиента
        const client = await this.handleClientMessage(callbackQuery.message);
        if (!client) {
          logger.warn(`Client not found for chat ${chatId}`);
          return;
        }
        
        logger.debug(`Processing callback query for client ${client.id}, action: ${data.action}, step_id: ${data.step_id}, value: ${data.value}`);
              
        // Обрабатываем различные типы действий
        switch (data.action) {
          case 'flow_response':
            // Отвечаем на callback query
            await this.bot.answerCallbackQuery(callbackQuery.id);
            
            // Проверяем, находится ли клиент в процессе опроса
            if (!this.clientSurveyState || !this.clientSurveyState[client.id]) {
              logger.warn(`No active flow state for client ${client.id}`);
              await this.bot.sendMessage(chatId, 'Ошибка: опрос не активен. Пожалуйста, начните опрос заново.');
              return;
            }
            
            // Обрабатываем ответ на шаг flow
            await this.handleFlowResponse(chatId, client.id, data.step_id, data.value);
          break;
          
          case 'start_flow': {
            // Отвечаем на callback query
            await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Starting survey' });
            
            // Получаем ID потока из значения
            const targetFlowId = parseInt(data.value);
            
            if (isNaN(targetFlowId)) {
              logger.warn(`Invalid flow ID: ${data.value}`);
              await this.bot.sendMessage(chatId, 'Ошибка при запуске опроса: некорректный ID потока');
              return;
            }
            
            // Получаем поток из базы данных
            const flow = await Flow.findByPk(targetFlowId, {
              include: [{ model: Step, as: 'flowSteps' }]
            });
            
            if (!flow) {
              logger.warn(`Flow ${targetFlowId} not found`);
              await this.bot.sendMessage(chatId, 'Ошибка при запуске опроса: опрос не найден');
              return;
            }
            
            // Удаляем оригинальное сообщение-приглашение
            try {
              await this.bot.deleteMessage(chatId, messageId);
              logger.debug(`Deleted invitation message ${messageId} in chat ${chatId}`);
            } catch (deleteError) {
              logger.warn(`Could not delete invitation message: ${deleteError.message}`);
            }
            
            // Запускаем поток
            await this.startFlow(chatId, client.id, flow);
            break;
          }
            
          case 'decline_flow': {
            // Отвечаем на callback query
            await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Опрос отменен' });
            
            // Удаляем сообщение с приглашением
            try {
              await this.bot.deleteMessage(chatId, messageId);
            } catch (error) {
              logger.warn(`Could not delete invitation message: ${error.message}`);
            }
            
            // Отправляем сообщение об отмене
            await this.bot.sendMessage(chatId, 'Вы отказались от прохождения опроса. Если передумаете, вы всегда можете начать его снова.');
            break;
          }
            
          default:
            logger.warn(`Unknown callback action: ${data.action}`);
            await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Неизвестное действие' });
        }
      } catch (error) {
        logger.error('Error handling callback query:', error);
        try {
          await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Произошла ошибка' });
        } catch (e) {
          logger.error('Error sending callback query answer:', e);
        }
      }
    });

    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      try {
        logger.info(`Received /start command from ${msg.chat.id}`);
        const client = await this.handleClientMessage(msg);
        
        // Проверяем, не находится ли клиент уже в процессе опроса
        if (client && this.clientSurveyState && this.clientSurveyState[client.id]) {
          logger.info(`Client ${client.id} is already in an active flow, ignoring /start command`);
          await this.bot.sendMessage(msg.chat.id, 'У вас уже есть активный опрос. Для отмены текущего опроса используйте команду /cancel.');
          return;
        }
        
        // Находим команду /start в базе данных
        const startCommand = this.commands.find(cmd => cmd.command === '/start');
        
        // Если команда найдена и у нее есть ответ, отправляем его
        if (startCommand && startCommand.response) {
          await this.bot.sendMessage(msg.chat.id, startCommand.response);
          
          // Сохраняем сообщение в базе данных
          if (client) {
            await Message.create({
              client_id: client.id,
              message_content: startCommand.response,
              is_from_bot: true,
              telegram_message_id: null,
              created_at: new Date(),
              updated_at: new Date()
            });
          }
          
          // Если у команды есть действие start_flow, запускаем соответствующий поток
          if (startCommand.action && startCommand.action.type === 'start_flow' && startCommand.action.flowId) {
            const flow = await Flow.findByPk(startCommand.action.flowId, {
              include: [{ model: Step, as: 'flowSteps' }]
            });
            
            if (flow && client) {
              await this.startFlow(msg.chat.id, client.id, flow);
            }
          }
          // Если у команды нет действия, но есть дефолтный поток, запускаем его
          else if (client) {
            // Try to find a default flow
            const defaultFlow = await Flow.findOne({
              where: { is_default: true, is_active: true },
              include: [{ model: Step, as: 'flowSteps' }]
            });
            
            if (defaultFlow) {
              await this.startFlow(msg.chat.id, client.id, defaultFlow);
            }
          }
          
          return;
        }
        
        // Если команда не найдена или у нее нет ответа, отправляем стандартное сообщение
        const response = 'Привет! Я бот поддержки. Используйте /help для просмотра доступных команд.';
        await this.bot.sendMessage(msg.chat.id, response);
        
        if (client) {
          await Message.create({
            client_id: client.id,
            message_content: response,
            is_from_bot: true,
            telegram_message_id: null,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      } catch (error) {
        logger.error('Error handling /start command:', error);
        await this.bot.sendMessage(msg.chat.id, 'Произошла ошибка при обработке команды. Пожалуйста, попробуйте позже.');
      }
    });
  }

  // Метод для создания и запуска потока выбора языка
  async createLanguageSelectionFlow() {
    try {
      logger.info('Creating language selection flow');
      
      // Проверяем, существует ли уже поток выбора языка
      let langFlow = await Flow.findOne({
        where: { name: 'Language Selection' }
      });
      
      if (!langFlow) {
        // Создаем новый поток для выбора языка
        langFlow = await Flow.create({
          name: 'Language Selection',
          description: 'Flow for selecting preferred language',
          is_active: true,
          is_default: false,
          created_by: 1 // Предполагаем, что ID 1 - это администратор
        });
        
        logger.info(`Created language selection flow with ID: ${langFlow.id}`);
        
        // Создаем шаг для выбора языка
        const langStep = await Step.create({
          flow_id: langFlow.id,
          order_index: 1,
          question: 'Please select your preferred language / Пожалуйста, выберите предпочитаемый язык',
          response_type: 'callback',
          is_required: true,
          options: [
            { text: '🇬🇧 English', value: 'en' },
            { text: '🇷🇺 Русский', value: 'ru' }
          ],
          button_style: 'inline',
          isFinal: true,
          config: {
            hide_step_counter: true
          }
        });
        
        logger.info(`Created language selection step with ID: ${langStep.id}`);
      }
      
      return langFlow;
    } catch (error) {
      logger.error('Error creating language selection flow:', error);
      return null;
    }
  }
  
  // Метод для запуска потока выбора языка
  async startLanguageSelectionFlow(chatId, clientId) {
    try {
      logger.info(`Starting language selection flow for client ${clientId}`);
      
      // Получаем или создаем поток выбора языка
      const langFlow = await this.createLanguageSelectionFlow();
      
      if (!langFlow) {
        logger.error('Failed to create language selection flow');
      return false;
      }
      
      // Загружаем шаги потока
      const flowWithSteps = await Flow.findByPk(langFlow.id, {
        include: [{ model: Step, as: 'flowSteps' }]
      });
      
      // Запускаем поток
      return await this.startFlow(chatId, clientId, flowWithSteps);
    } catch (error) {
      logger.error(`Error starting language selection flow for client ${clientId}:`, error);
      return false;
    }
  }

  // Метод для обработки выбора языка
  async handleLanguageSelection(chatId, clientId, value) {
    try {
      logger.info(`Handling language selection for client ${clientId}: ${value}`);
      
      // Обновляем язык клиента в базе данных
      await Client.update(
        { language: value },
        { where: { id: clientId } }
      );
      
      // Отправляем сообщение о успешном выборе языка
      let message;
      if (value === 'en') {
        message = 'Language set to English. You can change it anytime by using the /language command.';
      } else if (value === 'ru') {
        message = 'Язык установлен на русский. Вы можете изменить его в любое время с помощью команды /language.';
      } else {
        message = `Language set to ${value}. You can change it anytime by using the /language command.`;
      }
      
      await this.bot.sendMessage(chatId, message);
      
      // Сохраняем сообщение в базе данных
      await Message.create({
        client_id: clientId,
        message_content: message,
        is_from_bot: true,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`Error handling language selection for client ${clientId}:`, error);
      return false;
    }
  }

  // Метод для отправки сообщения с учетом языка клиента
  async sendLocalizedMessage(chatId, clientId, messageKey, options = {}) {
    try {
      // Получаем клиента из базы данных
      const client = await Client.findByPk(clientId);
      
      if (!client) {
        logger.warn(`Cannot send localized message: client ${clientId} not found`);
        return false;
      }
      
      // Определяем язык клиента
      const language = client.language || 'en';
      
      // Словарь сообщений
      const messages = {
        'welcome': {
          'en': 'Welcome to our bot! Use /help to see available commands.',
          'ru': 'Добро пожаловать в наш бот! Используйте /help для просмотра доступных команд.'
        },
        'help': {
          'en': 'Available commands:\n/start - Start the bot\n/language - Change language\n/cancel - Cancel current survey',
          'ru': 'Доступные команды:\n/start - Запустить бота\n/language - Изменить язык\n/cancel - Отменить текущий опрос'
        },
        'survey_cancelled': {
          'en': 'Survey cancelled. You can start a new one at any time.',
          'ru': 'Опрос отменен. Вы можете начать новый в любое время.'
        },
        'active_survey': {
          'en': 'You already have an active survey. To cancel the current survey, use the /cancel command.',
          'ru': 'У вас уже есть активный опрос. Для отмены текущего опроса используйте команду /cancel.'
        },
        'no_surveys': {
          'en': 'Welcome! Unfortunately, there are no available surveys.',
          'ru': 'Добро пожаловать! К сожалению, нет доступных опросов.'
        }
      };
      
      // Получаем сообщение для указанного ключа и языка
      let message = messages[messageKey]?.[language];
      
      // Если сообщение не найдено для указанного языка, используем английский
      if (!message) {
        message = messages[messageKey]?.['en'] || messageKey;
      }
      
      // Отправляем сообщение
      const sentMessage = await this.bot.sendMessage(chatId, message, options);
      
      // Сохраняем сообщение в базе данных
      await Message.create({
        client_id: clientId,
        message_content: message,
        is_from_bot: true,
        telegram_message_id: sentMessage.message_id.toString(),
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`Error sending localized message to client ${clientId}:`, error);
      return false;
    }
  }

  // Метод для массовой рассылки сообщений по языку
  async sendBulkMessageByLanguage(language, message, options = {}) {
    try {
      logger.info(`Starting bulk message sending to clients with language: ${language}`);
      
      // Получаем всех клиентов с указанным языком
      const clients = await Client.findAll({
        where: { language }
      });
      
      logger.info(`Found ${clients.length} clients with language ${language}`);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Отправляем сообщение каждому клиенту
      for (const client of clients) {
        try {
          // Получаем chat_id из telegram_id
          const chatId = client.telegram_id;
          
          // Отправляем сообщение
          const sentMessage = await this.bot.sendMessage(chatId, message, options);
          
          // Сохраняем сообщение в базе данных
          await Message.create({
            client_id: client.id,
            message_content: message,
            is_from_bot: true,
            telegram_message_id: sentMessage.message_id.toString(),
            created_at: new Date(),
            updated_at: new Date()
          });
          
          successCount++;
    } catch (error) {
          logger.error(`Error sending message to client ${client.id}:`, error);
          errorCount++;
        }
        
        // Добавляем небольшую задержку, чтобы не превысить лимиты Telegram API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      logger.info(`Bulk message sending completed. Success: ${successCount}, Errors: ${errorCount}`);
      
      return { successCount, errorCount };
    } catch (error) {
      logger.error(`Error sending bulk messages by language ${language}:`, error);
      return { successCount: 0, errorCount: 0, error: error.message };
    }
  }
  
  // Метод для массовой рассылки потока по языку
  async sendBulkFlowByLanguage(language, flowId) {
    try {
      logger.info(`Starting bulk flow sending to clients with language: ${language}, flow: ${flowId}`);
      
      // Получаем всех клиентов с указанным языком
      const clients = await Client.findAll({
        where: { language }
      });
      
      logger.info(`Found ${clients.length} clients with language ${language}`);
      
      // Получаем поток из базы данных
      const flow = await Flow.findByPk(flowId, {
        include: [{ model: Step, as: 'flowSteps' }]
      });
      
      if (!flow) {
        logger.error(`Flow ${flowId} not found`);
        return { successCount: 0, errorCount: 0, error: 'Flow not found' };
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      // Отправляем приглашение пройти поток каждому клиенту
      for (const client of clients) {
        try {
          // Получаем chat_id из telegram_id
          const chatId = client.telegram_id;
          
          // Отправляем приглашение пройти поток
          await this.sendFlowInvitation(chatId, client.id, flowId);
          
          successCount++;
    } catch (error) {
          logger.error(`Error sending flow invitation to client ${client.id}:`, error);
          errorCount++;
        }
        
        // Добавляем небольшую задержку, чтобы не превысить лимиты Telegram API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      logger.info(`Bulk flow sending completed. Success: ${successCount}, Errors: ${errorCount}`);
      
      return { successCount, errorCount };
    } catch (error) {
      logger.error(`Error sending bulk flow by language ${language}:`, error);
      return { successCount: 0, errorCount: 0, error: error.message };
    }
  }

  // Метод для массовой рассылки сообщений клиентам по языку
  async sendBulkMessageByLanguage(language, message) {
    try {
      logger.info(`Sending bulk message to clients with language ${language}`);
      
      // Получаем всех клиентов с указанным языком
      const clients = await Client.findAll({
        where: {
          language,
          is_blocked: false
        }
      });
      
      logger.info(`Found ${clients.length} clients with language ${language}`);
      
      let sentCount = 0;
      let errorCount = 0;
      
      // Отправляем сообщение каждому клиенту
      for (const client of clients) {
        try {
          await this.sendMessage(client.telegram_id, message);
          sentCount++;
        } catch (error) {
          logger.error(`Error sending message to client ${client.id}:`, error);
          errorCount++;
        }
      }
      
      logger.info(`Bulk message sent to ${sentCount} clients, errors: ${errorCount}`);
      
      return {
        sentCount,
        errorCount
      };
    } catch (error) {
      logger.error(`Error sending bulk message by language:`, error);
      throw error;
    }
  }

  // Метод для массовой рассылки приглашений на поток клиентам по языку
  async sendBulkFlowByLanguage(language, flowId) {
    try {
      logger.info(`Sending bulk flow invitation to clients with language ${language}`);
      
      // Получаем всех клиентов с указанным языком
      const clients = await Client.findAll({
        where: {
          language,
          is_blocked: false
        }
      });
      
      logger.info(`Found ${clients.length} clients with language ${language}`);
      
      let sentCount = 0;
      let errorCount = 0;
      
      // Получаем информацию о потоке
      const flow = await Flow.findByPk(flowId);
      
      if (!flow) {
        logger.warn(`Cannot send invitation: flow ${flowId} not found`);
        throw new Error(`Flow ${flowId} not found`);
      }
      
      // Отправляем приглашение каждому клиенту
      for (const client of clients) {
        try {
          await this.sendFlowInvitation(client.telegram_id, flowId);
          sentCount++;
    } catch (error) {
          logger.error(`Error sending flow invitation to client ${client.id}:`, error);
          errorCount++;
        }
      }
      
      logger.info(`Bulk flow invitation sent to ${sentCount} clients, errors: ${errorCount}`);
      
      return {
        sentCount,
        errorCount
      };
    } catch (error) {
      logger.error(`Error sending bulk flow by language:`, error);
      throw error;
    }
  }
}

module.exports = new BotService(); 
