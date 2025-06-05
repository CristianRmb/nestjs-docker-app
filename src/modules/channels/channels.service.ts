import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Channel, ChannelType } from '../../../generated/prisma';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  async createChannel(data: {
    name: string;
    description?: string;
    type: ChannelType;
    workspaceId: string;
    categoryId?: string;
    isPrivate?: boolean;
  }): Promise<Channel> {
    return this.prisma.channel.create({
      data,
      include: {
        workspace: true,
        category: true,
      },
    });
  }

  async findChannelsByWorkspace(workspaceId: string): Promise<Channel[]> {
    return this.prisma.channel.findMany({
      where: { workspaceId },
      include: {
        category: true,
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: true,
            attachments: true,
            reactions: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  async findChannelById(id: string): Promise<Channel | null> {
    return this.prisma.channel.findUnique({
      where: { id },
      include: {
        workspace: true,
        category: true,
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: true,
            attachments: true,
            reactions: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async updateChannel(
    id: string,
    data: {
      name?: string;
      description?: string;
      isPrivate?: boolean;
    },
  ): Promise<Channel> {
    return this.prisma.channel.update({
      where: { id },
      data,
      include: {
        workspace: true,
        category: true,
      },
    });
  }

  async deleteChannel(id: string): Promise<Channel> {
    return this.prisma.channel.delete({
      where: { id },
    });
  }
}
