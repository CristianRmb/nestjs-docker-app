import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.getway';

@Module({
  imports: [PrismaModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
