import { Controller, Post, Body, Get, Logger, OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';

@Controller('auth')
export class AuthController implements OnModuleInit {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {
    this.logger.log('Initializing AuthController...');
  }

  onModuleInit() {
    this.logger.log('AuthController initialized');
    this.logger.debug('AuthController routes:', {
      'GET /api/auth': 'Test endpoint',
      'POST /api/auth/login': 'User login',
      'POST /api/auth/register': 'User registration'
    });
  }

  @Get()
  test() {
    this.logger.log('GET /api/auth - Test endpoint hit');
    return { message: 'Auth controller is working' };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    this.logger.log('POST /api/auth/login - Login attempt');
    this.logger.debug('Login request body:', loginDto);
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    this.logger.log('POST /api/auth/register - Registration attempt');
    this.logger.debug('Registration request body:', createUserDto);
    try {
      const result = await this.authService.register(createUserDto);
      this.logger.log('Registration successful');
      return result;
    } catch (error) {
      this.logger.error('Registration failed:', error);
      throw error;
    }
  }
} 