import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DirectConversation } from '../../../generated/prisma';

@Injectable()
export class DirectConversationsService {
  constructor(private prisma: PrismaService) {}

  async createDirectConversation(
    userIds: string[],
  ): Promise<DirectConversation> {
    if (userIds.length !== 2) {
      throw new Error('Direct conversation must have exactly 2 users');
    }

    // Verifica se esiste già una conversazione tra questi utenti
    const existingConversation = await this.prisma.directConversation.findFirst(
      {
        where: {
          AND: [
            {
              members: {
                some: {
                  userId: userIds[0],
                },
              },
            },
            {
              members: {
                some: {
                  userId: userIds[1],
                },
              },
            },
          ],
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    );

    if (existingConversation) {
      return existingConversation;
    }

    // Crea nuova conversazione
    return this.prisma.directConversation.create({
      data: {
        members: {
          create: userIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
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

  async findDirectConversationsByUser(
    userId: string,
  ): Promise<DirectConversation[]> {
    return this.prisma.directConversation.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findDirectConversationById(
    id: string,
  ): Promise<DirectConversation | null> {
    return this.prisma.directConversation.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
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

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.prisma.directConversationMember.updateMany({
      where: {
        directConversationId: conversationId,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }
}
