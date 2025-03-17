import { Controller, Post, Body, Logger } from '@nestjs/common';
import { TelegramService } from './telegram.service';

interface CommandRequest {
  chatId: number;
  command: string;
  response: string;
}

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  @Post('execute-command')
  async executeCommand(@Body() request: CommandRequest) {
    this.logger.debug(`Received command execution request: ${JSON.stringify(request)}`);
    try {
      await this.telegramService.handleCustomCommand(
        request.chatId,
        request.command,
        request.response
      );
      return { success: true, message: 'Command executed successfully' };
    } catch (error) {
      this.logger.error('Failed to execute command:', error);
      throw error;
    }
  }
} 