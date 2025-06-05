import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';

@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Post('request')
  sendFriendRequest(
    @Body() requestDto: { requesterId: string; receiverId: string },
  ) {
    return this.friendshipsService.sendFriendRequest(
      requestDto.requesterId,
      requestDto.receiverId,
    );
  }

  @Put(':id/accept')
  acceptFriendRequest(@Param('id') friendshipId: string) {
    return this.friendshipsService.acceptFriendRequest(friendshipId);
  }

  @Put(':id/decline')
  declineFriendRequest(@Param('id') friendshipId: string) {
    return this.friendshipsService.declineFriendRequest(friendshipId);
  }

  @Get('user/:userId/friends')
  getFriends(@Param('userId') userId: string) {
    return this.friendshipsService.getFriends(userId);
  }

  @Get('user/:userId/pending')
  getPendingRequests(@Param('userId') userId: string) {
    return this.friendshipsService.getPendingRequests(userId);
  }

  @Post('block')
  blockUser(@Body() blockDto: { blockerId: string; blockedId: string }) {
    return this.friendshipsService.blockUser(
      blockDto.blockerId,
      blockDto.blockedId,
    );
  }

  @Post('unblock')
  unblockUser(@Body() unblockDto: { blockerId: string; blockedId: string }) {
    return this.friendshipsService.unblockUser(
      unblockDto.blockerId,
      unblockDto.blockedId,
    );
  }
}
