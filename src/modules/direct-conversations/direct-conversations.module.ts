import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { DirectConversationsController } from './direct-conversations.controller';
import { DirectConversationsService } from './direct-conversations.service';

@Module({
  imports: [PrismaModule],
  controllers: [DirectConversationsController],
  providers: [DirectConversationsService],
  exports: [DirectConversationsService],
})
export class DirectConversationsModule {}
