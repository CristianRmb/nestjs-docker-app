import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageReaction } from '../../../generated/prisma';

@Injectable()
export class ReactionsService {
  constructor(private prisma: PrismaService) {}

  async addReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<MessageReaction> {
    // Verifica se la reazione esiste già
    const existingReaction = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      // Se esiste già, la rimuoviamo (toggle)
      await this.prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });
      return existingReaction;
    }

    // Crea nuova reazione
    return this.prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
      include: {
        user: true,
        message: true,
      },
    });
  }

  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<void> {
    await this.prisma.messageReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  async getReactionsByMessage(messageId: string): Promise<MessageReaction[]> {
    return this.prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getReactionStats(messageId: string): Promise<
    {
      emoji: string;
      count: number;
      users: any[];
    }[]
  > {
    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Raggruppa per emoji
    const groupedReactions = reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: [],
          };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.user);
        return acc;
      },
      {} as Record<string, { emoji: string; count: number; users: any[] }>,
    );

    return Object.values(groupedReactions);
  }
}
