import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from './config/config';
import { User } from './entities/user.entity';
import { Client } from './entities/client.entity';
import { Message } from './entities/message.entity';
import { BotQuestion } from './entities/bot-question.entity';
import { AuthModule } from './auth/auth.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('TypeOrmConfig');
        logger.log('Initializing database connection...');
        logger.debug('Database configuration:', {
          host: configService.get('config.database.host'),
          port: configService.get('config.database.port'),
          username: configService.get('config.database.username'),
          database: configService.get('config.database.database'),
        });
        
        return {
          type: 'postgres',
          host: configService.get('config.database.host'),
          port: configService.get('config.database.port'),
          username: configService.get('config.database.username'),
          password: configService.get('config.database.password'),
          database: configService.get('config.database.database'),
          entities: [User, Client, Message, BotQuestion],
          synchronize: true,
          logging: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    TelegramModule,
  ],
})
export class AppModule {
  private readonly logger = new Logger(AppModule.name);

  constructor() {
    this.logger.log('Initializing AppModule...');
    this.logger.debug('AppModule configuration:', {
      imports: [
        'ConfigModule',
        'TypeOrmModule',
        'AuthModule',
        'TelegramModule'
      ]
    });
  }
}
