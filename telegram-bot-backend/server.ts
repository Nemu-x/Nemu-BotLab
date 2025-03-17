import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import config from './src/config/config';
import { json } from 'express';
import * as http from 'http';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    logger.log('Creating NestJS application...');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'debug', 'log', 'verbose'],
    });
    
    logger.log('Configuring middleware...');
    
    // Enable CORS
    app.enableCors({
      origin: '*',
      credentials: true,
    });

    // Set global prefix for API
    app.setGlobalPrefix('api');

    // Configure JSON parser
    app.use(json({ limit: '50mb' }));

    // Add request logging middleware
    app.use((req, res, next) => {
      logger.log(`Incoming ${req.method} request to ${req.url}`);
      logger.debug('Request headers:', req.headers);
      logger.debug('Request body:', req.body);
      next();
    });

    // Add global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    // Get port from environment or config
    const port = process.env.PORT || config().port || 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    logger.log('Environment variables:');
    logger.log('PORT:', process.env.PORT);
    logger.log('HOST:', process.env.HOST);
    logger.log('Config port:', config().port);
    logger.log(`Starting server on ${host}:${port}`);
    
    try {
      // Get the HTTP server instance from NestJS
      const server = app.getHttpServer();
      
      // Add error handlers
      server.on('error', (error: Error) => {
        logger.error('Server error:', error);
      });

      // Start the server with explicit callback
      await new Promise<void>((resolve, reject) => {
        server.listen(port, host, () => {
          logger.log(`HTTP Server is listening on ${host}:${port}`);
          resolve();
        });
        
        server.on('error', (error: Error) => {
          logger.error('Failed to start server:', error);
          reject(error);
        });
      });

      // Initialize the app after server is listening
      await app.init();
      
      // Log server status
      logger.log(`Application is running on: http://${host}:${port}`);
      logger.log('Server address:', server.address());
      logger.log('Server listening status:', server.listening);

      // Log all registered routes
      logger.log('Registered Routes:');
      const expressInstance = app.getHttpAdapter().getInstance();
      const router = expressInstance._router;
      
      // Log all routes including nested ones
      function printRoutes(layer: any, prefix = '') {
        if (layer.route) {
          // Routes registered directly on the app
          const path = layer.route.path;
          const methods = Object.keys(layer.route.methods);
          logger.log(`Found route: ${methods.join(',')} ${prefix + path}`);
        } else if (layer.name === 'router') {
          // Router middleware
          const routerPrefix = prefix + (layer.regexp.toString().replace(/\\\//g, '/').replace(/[^/]/g, ''));
          logger.log(`Found router with prefix: ${routerPrefix}`);
          layer.handle.stack.forEach((stackItem: any) => {
            printRoutes(stackItem, routerPrefix);
          });
        }
      }

      // Log the entire router stack for debugging
      logger.debug('Router stack:', JSON.stringify(router.stack, null, 2));
      
      router.stack.forEach((layer: any) => {
        printRoutes(layer);
      });
    } catch (error) {
      logger.error('Error starting server:', error);
      throw error;
    }
  } catch (error) {
    logger.error('Bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap(); 