import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '../../../generated/prisma';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  createNotification(
    @Body()
    createNotificationDto: {
      userId: string;
      type: NotificationType;
      title: string;
      message?: string;
      data?: any;
    },
  ) {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  @Get('user/:userId')
  findNotificationsByUser(
    @Param('userId') userId: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.notificationsService.findNotificationsByUser(
      userId,
      take ? parseInt(take) : 50,
      skip ? parseInt(skip) : 0,
    );
  }

  @Get('user/:userId/unread-count')
  getUnreadCount(@Param('userId') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put('user/:userId/read-all')
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Get('user/:userId/settings')
  getNotificationSettings(@Param('userId') userId: string) {
    return this.notificationsService.getNotificationSettings(userId);
  }

  @Put('user/:userId/settings')
  updateNotificationSettings(
    @Param('userId') userId: string,
    @Body() settings: any,
  ) {
    return this.notificationsService.updateNotificationSettings(
      userId,
      settings,
    );
  }
}
