import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/')
  getRoot(): string {
    return 'Welcome to the NestJS application!';
  }

  @Get('/health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
