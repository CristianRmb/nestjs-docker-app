import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Notification,
  NotificationType,
  NotificationSetting,
} from '../../../generated/prisma';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message?: string;
    data?: any;
  }): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        ...data,
        data: data.data ? JSON.stringify(data.data) : undefined,
      },
      include: {
        user: true,
      },
    });
  }

  async findNotificationsByUser(
    userId: string,
    take = 50,
    skip = 0,
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async getNotificationSettings(
    userId: string,
  ): Promise<NotificationSetting | null> {
    return this.prisma.notificationSetting.findUnique({
      where: { userId },
    });
  }

  async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSetting>,
  ): Promise<NotificationSetting> {
    return this.prisma.notificationSetting.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        ...settings,
      },
    });
  }
}
