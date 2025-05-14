import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as repl from 'repl';
import { UsersService } from './modules/users/users.service';
import { AuthService } from './modules/auth/auth.service';
import { SlackService } from './modules/slack/slack.service';
import { DataSource } from 'typeorm';

async function startRepl() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userService = app.get(UsersService);
  const authService = app.get(AuthService);
  const slackService = app.get(SlackService);
  const dataSource = app.get(DataSource);

  const r = repl.start('🟢 Nest REPL > ');
  r.context.app = app;
  r.context.userService = userService;
  r.context.authService = authService;
  r.context.slackService = slackService;
  r.context.dataSource = dataSource;
}

startRepl();
