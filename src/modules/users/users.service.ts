import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserStatus } from '../../../generated/prisma';
import { CreateUserInput, UpdateUserInput } from '../../types/prisma.types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async create(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        status: data.status || UserStatus.OFFLINE,
      },
    });
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getUserWithWorkspaces(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
        createdWorkspaces: true,
      },
    });
  }

  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { username: 'asc' },
    });
  }

  async getUserStats(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sentMessages: true,
            workspaceMembers: true,
            createdWorkspaces: true,
            friendsRequested: true,
            friendsReceived: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt,
      },
      stats: {
        messageCount: user._count.sentMessages,
        workspaceCount: user._count.workspaceMembers,
        ownedWorkspaceCount: user._count.createdWorkspaces,
        friendRequestsSent: user._count.friendsRequested,
        friendRequestsReceived: user._count.friendsReceived,
      },
    };
  }

  async getUserFriends(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        friendsRequested: {
          where: { status: 'ACCEPTED' },
          include: {
            receiver: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                status: true,
                lastSeen: true,
              },
            },
          },
        },
        friendsReceived: {
          where: { status: 'ACCEPTED' },
          include: {
            requester: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                status: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });
  }

  async getUserDirectConversations(id: string) {
    return this.prisma.directConversationMember.findMany({
      where: { userId: id },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                    status: true,
                    lastSeen: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });
  }

  async updateLastSeen(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        lastSeen: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getUserActivity(id: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [messageCount, reactionsCount, workspaceJoinedCount] =
      await Promise.all([
        // Messaggi inviati negli ultimi X giorni
        this.prisma.message.count({
          where: {
            senderId: id,
            createdAt: {
              gte: startDate,
            },
          },
        }),

        // Reazioni aggiunte negli ultimi X giorni
        this.prisma.messageReaction.count({
          where: {
            userId: id,
            createdAt: {
              gte: startDate,
            },
          },
        }),

        // Workspace joinati negli ultimi X giorni
        this.prisma.workspaceMember.count({
          where: {
            userId: id,
            joinedAt: {
              gte: startDate,
            },
          },
        }),
      ]);

    return {
      period: `${days} days`,
      activity: {
        messagesSent: messageCount,
        reactionsAdded: reactionsCount,
        workspacesJoined: workspaceJoinedCount,
      },
    };
  }

  async getUserNotifications(id: string, take: number = 20, skip: number = 0) {
    return this.prisma.notification.findMany({
      where: { userId: id },
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
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async checkUsernameAvailability(
    username: string,
  ): Promise<{ available: boolean }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    return { available: !existingUser };
  }

  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return { available: !existingUser };
  }

  async getUserProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatar: true,
        status: true,
        lastSeen: true,
        createdAt: true,
        _count: {
          select: {
            sentMessages: true,
            workspaceMembers: true,
            createdWorkspaces: true,
            friendsRequested: {
              where: { status: 'ACCEPTED' },
            },
            friendsReceived: {
              where: { status: 'ACCEPTED' },
            },
          },
        },
      },
    });
  }

  async bulkUpdateStatus(
    userIds: string[],
    status: UserStatus,
  ): Promise<{ count: number }> {
    const result = await this.prisma.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return { count: result.count };
  }
}
