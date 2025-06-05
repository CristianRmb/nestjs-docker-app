import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Message, MessageType } from '../../../generated/prisma';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: {
    content?: string;
    type?: MessageType;
    senderId: string;
    channelId?: string;
    directConversationId?: string;
    replyToId?: string;
  }): Promise<Message> {
    return this.prisma.message.create({
      data,
      include: {
        sender: true,
        channel: true,
        directConversation: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findMessagesByChannel(
    channelId: string,
    take = 50,
    skip = 0,
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        channelId,
        deletedAt: null,
      },
      include: {
        sender: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async findMessagesByDirectConversation(
    directConversationId: string,
    take = 50,
    skip = 0,
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        directConversationId,
        deletedAt: null,
      },
      include: {
        sender: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async updateMessage(id: string, content: string): Promise<Message> {
    return this.prisma.message.update({
      where: { id },
      data: {
        content,
        editedAt: new Date(),
      },
      include: {
        sender: true,
        channel: true,
        directConversation: true,
        attachments: true,
        reactions: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async deleteMessage(id: string): Promise<Message> {
    return this.prisma.message.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
