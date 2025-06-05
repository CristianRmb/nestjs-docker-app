import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Friendship, FriendshipStatus } from '../../../generated/prisma';

@Injectable()
export class FriendshipsService {
  constructor(private prisma: PrismaService) {}

  async sendFriendRequest(
    requesterId: string,
    receiverId: string,
  ): Promise<Friendship> {
    // Verifica che non esista già una richiesta
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    });

    if (existingFriendship) {
      throw new Error('Friendship already exists or pending');
    }

    return this.prisma.friendship.create({
      data: {
        requesterId,
        receiverId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        requester: true,
        receiver: true,
      },
    });
  }

  async acceptFriendRequest(friendshipId: string): Promise<Friendship> {
    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatus.ACCEPTED },
      include: {
        requester: true,
        receiver: true,
      },
    });
  }

  async declineFriendRequest(friendshipId: string): Promise<Friendship> {
    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatus.DECLINED },
      include: {
        requester: true,
        receiver: true,
      },
    });
  }

  async getFriends(userId: string): Promise<Friendship[]> {
    return this.prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { receiverId: userId }],
        status: FriendshipStatus.ACCEPTED,
      },
      include: {
        requester: true,
        receiver: true,
      },
    });
  }

  async getPendingRequests(userId: string): Promise<Friendship[]> {
    return this.prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        requester: true,
        receiver: true,
      },
    });
  }

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    await this.prisma.userBlock.create({
      data: {
        blockerId,
        blockedId,
      },
    });

    // Rimuovi amicizia se esiste
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: blockerId, receiverId: blockedId },
          { requesterId: blockedId, receiverId: blockerId },
        ],
      },
    });
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await this.prisma.userBlock.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    });
  }
}
