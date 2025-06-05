import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelPermission, Permission } from '../../../generated/prisma';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async createPermission(data: {
    channelId: string;
    userId?: string;
    roleId?: string;
    type: Permission;
    allowed: boolean;
  }): Promise<ChannelPermission> {
    return this.prisma.channelPermission.create({
      data: {
        channelId: data.channelId,
        userId: data.userId,
        roleId: data.roleId,
        type: data.type,
        allowed: data.allowed,
      },
      include: {
        channel: true,
      },
    });
  }

  async getPermissionsByChannel(
    channelId: string,
  ): Promise<ChannelPermission[]> {
    return this.prisma.channelPermission.findMany({
      where: { channelId },
      include: {
        channel: true,
      },
    });
  }

  async getUserPermissionsForChannel(
    channelId: string,
    userId: string,
  ): Promise<ChannelPermission[]> {
    return this.prisma.channelPermission.findMany({
      where: {
        channelId,
        userId,
      },
      include: {
        channel: true,
      },
    });
  }

  async checkPermission(
    channelId: string,
    userId: string,
    permission: Permission,
  ): Promise<boolean> {
    // Check user-specific permissions first
    const userPermission = await this.prisma.channelPermission.findFirst({
      where: {
        channelId,
        userId,
        type: permission,
      },
    });

    if (userPermission) {
      return userPermission.allowed;
    }

    // Default permissions for channel members
    return this.getDefaultPermission(permission);
  }

  private getDefaultPermission(permission: Permission): boolean {
    const defaultPermissions = {
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
      MANAGE_MESSAGES: false,
      EMBED_LINKS: true,
      ATTACH_FILES: true,
      READ_MESSAGE_HISTORY: true,
      MENTION_EVERYONE: false,
      USE_EXTERNAL_EMOJIS: true,
      CONNECT: true,
      SPEAK: true,
      MUTE_MEMBERS: false,
      DEAFEN_MEMBERS: false,
      MOVE_MEMBERS: false,
      USE_VOICE_ACTIVITY: true,
      MANAGE_CHANNEL: false,
      MANAGE_ROLES: false,
      MANAGE_WEBHOOKS: false,
      MANAGE_EMOJIS: false,
    };

    return defaultPermissions[permission] || false;
  }

  async updatePermission(
    id: string,
    allowed: boolean,
  ): Promise<ChannelPermission> {
    return this.prisma.channelPermission.update({
      where: { id },
      data: { allowed },
      include: {
        channel: true,
      },
    });
  }

  async deletePermission(id: string): Promise<ChannelPermission> {
    return this.prisma.channelPermission.delete({
      where: { id },
    });
  }

  async bulkCreatePermissions(
    permissions: Array<{
      channelId: string;
      userId?: string;
      roleId?: string;
      type: Permission;
      allowed: boolean;
    }>,
  ): Promise<number> {
    const result = await this.prisma.channelPermission.createMany({
      data: permissions,
    });

    return result.count;
  }
}
