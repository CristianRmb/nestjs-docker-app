import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { DirectConversationsService } from './direct-conversations.service';

@Controller('direct-conversations')
export class DirectConversationsController {
  constructor(
    private readonly directConversationsService: DirectConversationsService,
  ) {}

  @Post()
  createDirectConversation(@Body() createDto: { userIds: string[] }) {
    return this.directConversationsService.createDirectConversation(
      createDto.userIds,
    );
  }

  @Get('user/:userId')
  findDirectConversationsByUser(@Param('userId') userId: string) {
    return this.directConversationsService.findDirectConversationsByUser(
      userId,
    );
  }

  @Get(':id')
  findDirectConversationById(@Param('id') id: string) {
    return this.directConversationsService.findDirectConversationById(id);
  }

  @Put(':id/read')
  markAsRead(
    @Param('id') conversationId: string,
    @Body() markReadDto: { userId: string },
  ) {
    return this.directConversationsService.markAsRead(
      conversationId,
      markReadDto.userId,
    );
  }
}
