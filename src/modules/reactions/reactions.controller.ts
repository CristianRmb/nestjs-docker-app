import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';

@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post(':messageId')
  async addReaction(
    @Param('messageId') messageId: string,
    @Body() data: { userId: string; emoji: string },
  ) {
    return this.reactionsService.addReaction(
      messageId,
      data.userId,
      data.emoji,
    );
  }

  @Delete(':messageId/:userId/:emoji')
  async removeReaction(
    @Param('messageId') messageId: string,
    @Param('userId') userId: string,
    @Param('emoji') emoji: string,
  ) {
    return this.reactionsService.removeReaction(messageId, userId, emoji);
  }

  @Get('message/:messageId')
  async getReactionsByMessage(@Param('messageId') messageId: string) {
    return this.reactionsService.getReactionsByMessage(messageId);
  }

  @Get('stats/:messageId')
  async getReactionStats(@Param('messageId') messageId: string) {
    return this.reactionsService.getReactionStats(messageId);
  }
}
