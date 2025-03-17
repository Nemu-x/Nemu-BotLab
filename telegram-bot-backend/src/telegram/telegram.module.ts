import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BotQuestion } from '../entities/bot-question.entity';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { BotCommandsService } from './bot-commands.service';
import { BotCommandsController } from './bot-commands.controller';
import { BotManagerService } from './bot-manager.service';
import { Message } from '../entities/message.entity';
import { Client } from '../entities/client.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([BotQuestion, Message, Client]),
  ],
  controllers: [TelegramController, BotCommandsController],
  providers: [
    BotManagerService,
    TelegramService,
    BotCommandsService,
  ],
  exports: [TelegramService, BotCommandsService],
})
export class TelegramModule {} 