import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Put,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.getway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  @Post()
  async createMessage(@Body() createMessageDto: any, @Request() req: any) {
    const messageData = {
      ...createMessageDto,
      senderId: req.user.userId, // Extract from JWT token
    };
    return this.messagesService.createMessage(messageData);
  }

  @Get('channel/:channelId')
  async getChannelMessages(
    @Param('channelId') channelId: string,
    @Query('take') take = 50,
    @Query('skip') skip = 0,
  ) {
    return this.messagesService.findMessagesByChannel(channelId, +take, +skip);
  }

  @Get('conversation/:conversationId')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query('take') take = 50,
    @Query('skip') skip = 0,
  ) {
    return this.messagesService.findMessagesByDirectConversation(
      conversationId,
      +take,
      +skip,
    );
  }

  @Put(':id')
  async updateMessage(@Param('id') id: string, @Body() updateData: any) {
    const updatedMessage = await this.messagesService.updateMessage(
      id,
      updateData.content,
    );

    // Notifica aggiornamento via WebSocket
    this.messagesGateway.server.emit('message_updated', updatedMessage);

    return updatedMessage;
  }

  @Delete(':id')
  async deleteMessage(@Param('id') id: string) {
    const deletedMessage = await this.messagesService.deleteMessage(id);

    // Notifica eliminazione via WebSocket
    this.messagesGateway.server.emit('message_deleted', { id });

    return deletedMessage;
  }
}
