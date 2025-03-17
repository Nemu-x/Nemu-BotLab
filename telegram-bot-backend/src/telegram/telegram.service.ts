import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BotCommandsService } from './bot-commands.service';
import { BotManagerService } from './bot-manager.service';
import { Context, Telegraf } from 'telegraf';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageDirection } from '../entities/message.entity';
import { Client } from '../entities/client.entity';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf<Context>;
  private handlersSet = false;
  private updatePromise: Promise<void> | null = null;

  constructor(
    private botCommandsService: BotCommandsService,
    private botManagerService: BotManagerService,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async onModuleInit() {
    await this.initializeBot();
  }

  private async initializeBot() {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        this.logger.log('Starting Telegram service initialization...');
        
        // Initialize bot manager if not already initialized
        if (!this.botManagerService.isInitialized()) {
          this.logger.log('Bot manager not initialized, initializing...');
          try {
            await Promise.race([
              this.botManagerService.initializeBot(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Bot manager initialization timeout')), 30000)
              )
            ]);
            this.logger.log('Bot manager initialized successfully');
          } catch (error) {
            this.logger.error(`Failed to initialize bot manager (attempt ${retryCount + 1}/${maxRetries}):`, error);
            retryCount++;
            if (retryCount < maxRetries) {
              this.logger.log(`Retrying in 5 seconds...`);
              await new Promise(resolve => setTimeout(resolve, 5000));
              continue;
            }
            throw error;
          }
        } else {
          this.logger.log('Bot manager already initialized');
        }

        this.logger.log('Getting bot instance...');
        this.bot = this.botManagerService.getBot();
        
        // Verify bot is working
        try {
          const me = await this.bot.telegram.getMe();
          this.logger.log('Bot verified successfully:', me.username);
        } catch (error) {
          this.logger.error('Failed to verify bot:', error);
          throw new Error('Bot verification failed');
        }
        
        if (!this.handlersSet) {
          this.logger.log('Setting up bot handlers...');
          await this.setupHandlers();
          this.logger.log('Bot handlers set up successfully');
        } else {
          this.logger.log('Bot handlers already set up');
        }
        
        this.logger.log('Telegram service initialized successfully');
        return;
      } catch (error) {
        this.logger.error(`Failed to initialize Telegram service (attempt ${retryCount + 1}/${maxRetries}):`, error);
        retryCount++;
        if (retryCount < maxRetries) {
          this.logger.log(`Retrying in 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        throw error;
      }
    }
  }

  private async setupHandlers() {
    if (!this.bot) {
      this.logger.error('Bot is not initialized');
      throw new Error('Bot is not initialized');
    }

    try {
      // Basic error handling
      this.bot.catch((err: Error) => {
        this.logger.error('Telegram bot error:', err);
      });

      // Start command
      this.bot.command('start', async (ctx) => {
        const client = await this.clientRepository.findOne({
          where: { telegramId: ctx.from.id.toString() },
        });

        if (!client) {
          await this.clientRepository.save({
            telegramId: ctx.from.id.toString(),
            username: ctx.from.username,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name,
          });
        }

        await ctx.reply('Привет! Я бот поддержки. Чем могу помочь?');
      });

      // Help command
      this.bot.command('help', async (ctx) => {
        try {
          const commands = await this.botCommandsService.getAllCommands();
          if (!commands.length) {
            await ctx.reply('В данный момент доступных команд нет. Пожалуйста, попробуйте позже или обратитесь к администратору.');
            return;
          }

          const helpMessage = commands
            .map(cmd => `• ${cmd.question}`)
            .join('\n');
          await ctx.reply(`Доступные команды:\n${helpMessage}`);
        } catch (error) {
          this.logger.error('Error in help command:', error);
          await ctx.reply('Произошла ошибка при получении списка команд. Пожалуйста, попробуйте позже.');
        }
      });

      // Message handling middleware
      this.bot.use(async (ctx, next) => {
        if (!('text' in ctx.message)) {
          this.logger.debug('Received non-text message');
          return next();
        }

        const message = ctx.message.text;
        this.logger.debug(`Received message: ${message}`);

        try {
          // Save client if not exists
          let client = await this.clientRepository.findOne({
            where: { telegramId: ctx.from.id.toString() },
          });

          if (!client) {
            client = await this.clientRepository.save({
              telegramId: ctx.from.id.toString(),
              username: ctx.from.username,
              firstName: ctx.from.first_name,
              lastName: ctx.from.last_name,
            });
          }

          // Save incoming message
          await this.messageRepository.save({
            content: message,
            direction: MessageDirection.INCOMING,
            clientId: client.id,
          });

          // Remove leading slash if present
          const cleanMessage = message.startsWith('/') ? message.slice(1) : message;
          this.logger.debug(`Processing message: ${cleanMessage}`);

          // Get all available commands for debugging
          const allCommands = await this.botCommandsService.getAllCommands();
          this.logger.debug(`Available commands: ${JSON.stringify(allCommands, null, 2)}`);

          const matchingCommand = await this.botCommandsService.findMatchingCommand(cleanMessage);
          if (matchingCommand) {
            this.logger.debug('Found matching command:', matchingCommand);
            await ctx.reply(matchingCommand.answer);
            return;
          } else {
            this.logger.debug('No matching command found');
            await ctx.reply('Извините, я не знаю, как ответить на это сообщение. Используйте /help для просмотра доступных команд.');
            return;
          }
        } catch (error) {
          this.logger.error('Error processing message:', error);
          await ctx.reply('Извините, произошла ошибка при обработке вашего сообщения.');
          return;
        }
      });

      this.handlersSet = true;
      this.logger.log('Bot handlers set up successfully');
    } catch (error) {
      this.logger.error('Failed to set up bot handlers:', error);
      throw error;
    }
  }

  // Method to send message to specific chat
  async sendMessage(chatId: number, message: string) {
    try {
      await this.bot.telegram.sendMessage(chatId, message);
      
      // Save outgoing message
      const client = await this.clientRepository.findOne({
        where: { telegramId: chatId.toString() },
      });

      if (client) {
        await this.messageRepository.save({
          content: message,
          direction: MessageDirection.OUTGOING,
          clientId: client.id,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send message to chat ${chatId}:`, error);
      throw error;
    }
  }

  // Method to handle custom commands from admin panel
  async handleCustomCommand(chatId: number, command: string, response: string) {
    try {
      await this.bot.telegram.sendMessage(chatId, response);
    } catch (error) {
      this.logger.error(`Failed to handle custom command for chat ${chatId}:`, error);
      throw error;
    }
  }

  // Method to get message history
  async getMessageHistory(telegramId: string) {
    const client = await this.clientRepository.findOne({
      where: { telegramId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    return this.messageRepository.find({
      where: { clientId: client.id },
      order: { createdAt: 'ASC' },
    });
  }

  // Method to get all clients
  async getClients() {
    return this.clientRepository.find();
  }

  // Method to update command handlers
  async updateCommandHandlers() {
    if (this.updatePromise) {
      this.logger.log('Command handlers update already in progress, waiting for completion...');
      try {
        await Promise.race([
          this.updatePromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Command handlers update timeout')), 30000)
          )
        ]);
        this.logger.log('Previous update completed successfully');
        return;
      } catch (error) {
        this.logger.error('Previous update failed or timed out:', error);
        this.updatePromise = null;
      }
    }

    this.updatePromise = (async () => {
      try {
        this.logger.log('Starting command handlers update...');
        
        if (!this.bot) {
          this.logger.log('Bot not initialized, initializing...');
          await this.initializeBot();
          return;
        }

        this.logger.log('Updating bot configuration...');
        await this.botManagerService.updateBot();
        
        this.logger.log('Setting up new command handlers...');
        this.handlersSet = false; // Reset handlers flag
        await this.setupHandlers();
        
        this.logger.log('Command handlers updated successfully');
      } catch (error) {
        this.logger.error('Failed to update command handlers:', error);
        throw error;
      } finally {
        this.updatePromise = null;
        this.logger.log('Command handlers update completed');
      }
    })();

    return this.updatePromise;
  }
} 