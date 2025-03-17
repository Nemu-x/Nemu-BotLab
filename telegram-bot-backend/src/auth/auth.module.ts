import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule implements OnModuleInit {
  private readonly logger = new Logger(AuthModule.name);

  constructor() {
    this.logger.log('Initializing AuthModule...');
  }

  onModuleInit() {
    this.logger.log('AuthModule initialized');
    this.logger.debug('AuthModule configuration:', {
      controllers: [AuthController.name],
      providers: [AuthService.name],
      imports: ['TypeOrmModule.forFeature([User])']
    });
  }
} 