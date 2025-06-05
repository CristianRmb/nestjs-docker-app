import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsService } from './friendships.service';

@Module({
  imports: [PrismaModule],
  controllers: [FriendshipsController],
  providers: [FriendshipsService],
  exports: [FriendshipsService],
})
export class FriendshipsModule {}
