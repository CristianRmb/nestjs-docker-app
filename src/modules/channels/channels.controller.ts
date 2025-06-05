import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelType } from '../../../generated/prisma';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  createChannel(
    @Body()
    createChannelDto: {
      name: string;
      description?: string;
      type: ChannelType;
      workspaceId: string;
      categoryId?: string;
      isPrivate?: boolean;
    },
  ) {
    return this.channelsService.createChannel(createChannelDto);
  }

  @Get('workspace/:workspaceId')
  findChannelsByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.channelsService.findChannelsByWorkspace(workspaceId);
  }

  @Get(':id')
  findChannelById(@Param('id') id: string) {
    return this.channelsService.findChannelById(id);
  }

  @Put(':id')
  updateChannel(
    @Param('id') id: string,
    @Body()
    updateChannelDto: {
      name?: string;
      description?: string;
      isPrivate?: boolean;
    },
  ) {
    return this.channelsService.updateChannel(id, updateChannelDto);
  }

  @Delete(':id')
  deleteChannel(@Param('id') id: string) {
    return this.channelsService.deleteChannel(id);
  }
}
