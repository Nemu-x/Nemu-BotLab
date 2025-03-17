import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotQuestion } from '../entities/bot-question.entity';

@Injectable()
export class BotManagerService implements OnModuleDestroy {
  private readonly logger = new Logger(BotManagerService.name);
  private bot: Telegraf<Context>;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private updatePromise: Promise<void> | null = null;

  constructor(
    private configService: ConfigService,
    @InjectRepository(BotQuestion)
    private botQuestionRepository: Repository<BotQuestion>,
  ) {}

  async onModuleDestroy() {
    await this.stopBot();
  }

  private async createBot(): Promise<Telegraf<Context>> {
    this.logger.log('Creating new bot instance...');
    const token = this.configService.get<string>('config.telegram.token');
    if (!token) {
      throw new Error('Telegram token not found in configuration');
    }

    this.logger.log('Initializing Telegraf instance...');
    const bot = new Telegraf<Context>(token);
    
    this.logger.log('Configuring bot settings...');
    try {
      // First, try to get bot info to verify token
      const me = await bot.telegram.getMe();
      this.logger.log('Bot info retrieved successfully:', me.username);
      
      // Then try to delete webhook
      try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        this.logger.log('Webhook deleted successfully');
      } catch (webhookError) {
        this.logger.warn('Failed to delete webhook:', webhookError);
        // Continue anyway as this might be expected if no webhook was set
      }
      
      // Wait a bit to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Then set commands
      try {
        await bot.telegram.setMyCommands([]);
        this.logger.log('Commands cleared successfully');
      } catch (commandsError) {
        this.logger.warn('Failed to clear commands:', commandsError);
        // Continue anyway as this is not critical
      }
      
      // Wait a bit before launching
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Finally launch the bot
      this.logger.log('Launching bot...');
      try {
        await Promise.race([
          bot.launch({
            dropPendingUpdates: true,
            allowedUpdates: ['message', 'callback_query']
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Bot launch timeout')), 15000)
          )
        ]);
        this.logger.log('Bot launched successfully');
      } catch (error) {
        this.logger.error('Error during bot launch:', error);
        throw error;
      }
    } catch (error) {
      this.logger.error('Error during bot configuration:', error);
      // Try to stop the bot if it was partially initialized
      try {
        await bot.stop();
      } catch (stopError) {
        this.logger.error('Error while stopping partially initialized bot:', stopError);
      }
      throw error;
    }

    return bot;
  }

  async initializeBot(): Promise<void> {
    if (this.initialized) {
      this.logger.log('Bot already initialized');
      return;
    }

    if (this.initializationPromise) {
      this.logger.log('Bot initialization already in progress, waiting for completion...');
      try {
        await Promise.race([
          this.initializationPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Bot initialization timeout')), 30000)
          )
        ]);
        this.logger.log('Previous initialization completed successfully');
        return;
      } catch (error) {
        this.logger.error('Previous initialization failed or timed out:', error);
        this.initializationPromise = null;
        this.initialized = false;
      }
    }

    this.initializationPromise = (async () => {
      try {
        this.logger.log('Starting Telegram bot initialization...');
        
        // Stop any existing bot instance
        this.logger.log('Stopping any existing bot instance...');
        await this.stopBot();
        
        // Wait for cleanup with timeout
        this.logger.log('Waiting for cleanup...');
        await Promise.race([
          new Promise(resolve => setTimeout(resolve, 2000)),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Cleanup timeout')), 5000)
          )
        ]);
        
        // Create and launch new bot instance
        this.logger.log('Creating new bot instance...');
        this.bot = await this.createBot();
        
        // Verify bot is working by making a test API call
        this.logger.log('Verifying bot connection...');
        await Promise.race([
          this.bot.telegram.getMe(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Bot verification timeout')), 5000)
          )
        ]);
        
        this.initialized = true;
        this.logger.log('Bot initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Telegram bot:', error);
        this.initialized = false;
        // Try to stop the bot if it was partially initialized
        if (this.bot) {
          try {
            await this.bot.stop();
          } catch (stopError) {
            this.logger.error('Error while stopping partially initialized bot:', stopError);
          }
          this.bot = null;
        }
        throw error;
      } finally {
        this.initializationPromise = null;
        this.logger.log('Bot initialization process completed');
      }
    })();

    return this.initializationPromise;
  }

  getBot(): Telegraf<Context> {
    if (!this.bot) {
      throw new Error('Bot is not initialized');
    }
    return this.bot;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async stopBot(): Promise<void> {
    if (this.bot) {
      try {
        this.logger.log('Stopping bot...');
        await Promise.race([
          this.bot.stop(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Bot stop timeout')), 10000)
          )
        ]);
        this.logger.log('Bot stopped successfully');
      } catch (error) {
        this.logger.error('Error while stopping bot:', error);
      } finally {
        this.bot = null;
        this.initialized = false;
        // Wait a bit after stopping
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  async updateBot(): Promise<void> {
    if (this.updatePromise) {
      this.logger.log('Bot update already in progress, waiting for completion...');
      try {
        // Add timeout to prevent infinite waiting
        await Promise.race([
          this.updatePromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Bot update timeout')), 30000)
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
        this.logger.log('Starting bot update...');
        
        if (!this.bot || !this.initialized) {
          this.logger.log('Bot not initialized, creating new instance...');
          await this.initializeBot();
          return;
        }

        this.logger.log('Updating bot configuration...');
        await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
        await this.bot.telegram.setMyCommands([]);
        this.logger.log('Bot configuration updated successfully');
      } catch (error) {
        this.logger.error('Failed to update bot:', error);
        throw error;
      } finally {
        this.updatePromise = null;
        this.logger.log('Bot update completed');
      }
    })();

    return this.updatePromise;
  }

  async sendMessage(chatId: number, message: string) {
    try {
      await this.bot.telegram.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error(`Failed to send message to chat ${chatId}:`, error);
      throw error;
    }
  }

  async handleCustomCommand(chatId: number, command: string, response: string) {
    try {
      await this.bot.telegram.sendMessage(chatId, response);
    } catch (error) {
      this.logger.error(`Failed to handle custom command for chat ${chatId}:`, error);
      throw error;
    }
  }
} 