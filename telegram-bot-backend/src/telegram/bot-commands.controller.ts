import { Controller, Get, Post, Body, Param, Logger, Put, Delete } from '@nestjs/common';
import { BotCommandsService } from './bot-commands.service';
import { TelegramService } from './telegram.service';
import { CreateBotCommandDto } from './dto/create-bot-command.dto';
import { UpdateBotCommandDto } from './dto/update-bot-command.dto';
import { BotQuestion } from '../entities/bot-question.entity';

@Controller('bot-commands')
export class BotCommandsController {
  private readonly logger = new Logger(BotCommandsController.name);

  constructor(
    private readonly botCommandsService: BotCommandsService,
    private readonly telegramService: TelegramService,
  ) {}

  @Get()
  async getAllCommands(): Promise<BotQuestion[]> {
    this.logger.debug('Getting all commands');
    const commands = await this.botCommandsService.getAllCommands();
    this.logger.debug(`Found ${commands.length} commands`);
    return commands;
  }

  @Get(':id')
  async getCommandById(@Param('id') id: string): Promise<BotQuestion> {
    this.logger.debug(`Getting command with ID: ${id}`);
    const command = await this.botCommandsService.getCommandById(parseInt(id, 10));
    this.logger.debug('Command found:', command);
    return command;
  }

  @Post()
  async createCommand(@Body() createBotCommandDto: CreateBotCommandDto): Promise<BotQuestion> {
    this.logger.debug('Creating new command:', createBotCommandDto);
    
    try {
      const command = await this.botCommandsService.createCommand(createBotCommandDto);
      this.logger.debug('Command created successfully:', command);

      // Update command handlers
      try {
        this.logger.log('Starting command handlers update...');
        await Promise.race([
          this.telegramService.updateCommandHandlers(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Command handlers update timeout')), 30000)
          )
        ]);
        this.logger.log('Command handlers updated successfully');
      } catch (error) {
        this.logger.error('Failed to update command handlers:', error);
        // Don't throw here, just log the error
        // The command was created successfully, so we should return it
        // But we should also return a warning in the response
        return {
          ...command,
          warning: error.message.includes('timeout') 
            ? 'Command created but bot initialization timed out. Please try updating handlers again later.'
            : 'Command created but failed to update bot handlers. Please try updating handlers again later.'
        };
      }

      return command;
    } catch (error) {
      this.logger.error('Failed to create command:', error);
      throw error;
    }
  }

  @Put(':id')
  async updateCommand(
    @Param('id') id: string,
    @Body() updateBotCommandDto: CreateBotCommandDto,
  ): Promise<BotQuestion> {
    this.logger.debug(`Updating command with ID: ${id}`, updateBotCommandDto);
    const command = await this.botCommandsService.updateCommand(parseInt(id, 10), updateBotCommandDto);
    this.logger.debug('Command updated successfully:', command);

    // Update command handlers
    try {
      this.logger.log('Updating command handlers...');
      await this.telegramService.updateCommandHandlers();
      this.logger.log('Command handlers updated successfully');
    } catch (error) {
      this.logger.error('Failed to update command handlers:', error);
      throw error;
    }

    return command;
  }

  @Delete(':id')
  async deleteCommand(@Param('id') id: string): Promise<void> {
    await this.botCommandsService.deleteCommand(parseInt(id, 10));

    // Update command handlers
    try {
      this.logger.log('Updating command handlers...');
      await this.telegramService.updateCommandHandlers();
      this.logger.log('Command handlers updated successfully');
    } catch (error) {
      this.logger.error('Failed to update command handlers:', error);
      throw error;
    }
  }

  @Put(':id/toggle')
  async toggleCommand(@Param('id') id: string): Promise<BotQuestion> {
    this.logger.debug(`Toggling command with ID: ${id}`);
    const command = await this.botCommandsService.toggleCommand(parseInt(id, 10));
    this.logger.debug('Command toggled successfully:', command);

    // Update command handlers
    try {
      this.logger.log('Updating command handlers...');
      await this.telegramService.updateCommandHandlers();
      this.logger.log('Command handlers updated successfully');
    } catch (error) {
      this.logger.error('Failed to update command handlers:', error);
      throw error;
    }

    return command;
  }
} 