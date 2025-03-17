import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotQuestion } from '../entities/bot-question.entity';
import { CreateBotCommandDto } from './dto/create-bot-command.dto';
import { UpdateBotCommandDto } from './dto/update-bot-command.dto';

@Injectable()
export class BotCommandsService {
  private readonly logger = new Logger(BotCommandsService.name);

  constructor(
    @InjectRepository(BotQuestion)
    private botQuestionRepository: Repository<BotQuestion>,
  ) {}

  async getAllCommands(): Promise<BotQuestion[]> {
    this.logger.debug('Fetching all active commands');
    const commands = await this.botQuestionRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    this.logger.debug(`Found ${commands.length} active commands`);
    return commands;
  }

  async getCommandById(id: number): Promise<BotQuestion> {
    this.logger.debug(`Fetching command with ID: ${id}`);
    const command = await this.botQuestionRepository.findOne({ where: { id } });
    this.logger.debug('Command found:', command);
    return command;
  }

  async findMatchingCommand(message: string): Promise<BotQuestion | null> {
    this.logger.debug(`Finding matching command for message: ${message}`);
    const commands = await this.getAllCommands();
    
    // Try exact match first
    const exactMatch = commands.find(cmd => 
      cmd.question.toLowerCase() === message.toLowerCase()
    );
    if (exactMatch) {
      this.logger.debug('Found exact match:', exactMatch);
      return exactMatch;
    }

    // Try partial match
    const partialMatch = commands.find(cmd => 
      message.toLowerCase().includes(cmd.question.toLowerCase())
    );
    if (partialMatch) {
      this.logger.debug('Found partial match:', partialMatch);
      return partialMatch;
    }

    this.logger.debug('No matching command found');
    return null;
  }

  async createCommand(createBotCommandDto: CreateBotCommandDto): Promise<BotQuestion> {
    this.logger.debug('Creating new command:', createBotCommandDto);
    const command = this.botQuestionRepository.create({
      ...createBotCommandDto,
      isActive: createBotCommandDto.isActive ?? true,
    });
    const savedCommand = await this.botQuestionRepository.save(command);
    this.logger.debug('Command saved successfully:', savedCommand);
    return savedCommand;
  }

  async updateCommand(id: number, updateBotCommandDto: UpdateBotCommandDto): Promise<BotQuestion> {
    this.logger.debug(`Updating command with ID: ${id}`, updateBotCommandDto);
    const existingCommand = await this.getCommandById(id);
    if (!existingCommand) {
      throw new Error(`Command with ID ${id} not found`);
    }

    const mergedData = {
      ...existingCommand,
      ...updateBotCommandDto,
    };
    const updatedCommand = await this.botQuestionRepository.save(mergedData);
    this.logger.debug('Command updated successfully:', updatedCommand);
    return updatedCommand;
  }

  async toggleCommand(id: number): Promise<BotQuestion> {
    this.logger.debug(`Toggling command with ID: ${id}`);
    const command = await this.getCommandById(id);
    if (!command) {
      throw new Error(`Command with ID ${id} not found`);
    }

    command.isActive = !command.isActive;
    const toggledCommand = await this.botQuestionRepository.save(command);
    this.logger.debug('Command toggled successfully:', toggledCommand);
    return toggledCommand;
  }

  async deleteCommand(id: number): Promise<void> {
    this.logger.debug(`Deleting command with ID: ${id}`);
    const command = await this.getCommandById(id);
    if (!command) {
      throw new Error(`Command with ID ${id} not found`);
    }

    await this.botQuestionRepository.remove(command);
    this.logger.debug('Command deleted successfully');
  }
} 