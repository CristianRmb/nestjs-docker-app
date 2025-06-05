import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket[]>(); // userId -> Socket[]

  constructor(
    private messagesService: MessagesService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Autenticazione del client (JWT token)
      const token = client.handshake.auth.token;
      const userId = await this.validateToken(token);

      if (!userId) {
        client.disconnect();
        return;
      }

      // Associa socket all'utente
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(client);

      // Unisciti alle "room" delle conversazioni
      await this.joinUserRooms(client, userId);

      // Aggiorna status utente
      await this.updateUserStatus(userId, 'ONLINE');

      console.log(`User ${userId} connected`);
    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    // Rimuovi socket dall'utente
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.indexOf(client);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
          await this.updateUserStatus(userId, 'OFFLINE');
        }
        break;
      }
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    data: {
      content: string;
      channelId?: string;
      directConversationId?: string;
      replyToId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = await this.getUserFromSocket(client);

      // Crea messaggio nel database
      const message = await this.messagesService.createMessage({
        ...data,
        senderId: userId,
      });

      // Invia a tutti i partecipanti
      if (data.channelId) {
        // Messaggio in canale
        this.server
          .to(`channel:${data.channelId}`)
          .emit('new_message', message);
      } else if (data.directConversationId) {
        // Messaggio diretto
        this.server
          .to(`conversation:${data.directConversationId}`)
          .emit('new_message', message);

        // Invia notifica push se utente offline
        await this.sendPushNotificationIfNeeded(
          data.directConversationId,
          message,
        );
      }
    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @MessageBody() data: { channelId?: string; directConversationId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = await this.getUserFromSocket(client);
    const room = data.channelId
      ? `channel:${data.channelId}`
      : `conversation:${data.directConversationId}`;

    client.to(room).emit('user_typing', { userId, typing: true });
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @MessageBody() data: { channelId?: string; directConversationId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = await this.getUserFromSocket(client);
    const room = data.channelId
      ? `channel:${data.channelId}`
      : `conversation:${data.directConversationId}`;

    client.to(room).emit('user_typing', { userId, typing: false });
  }

  // Metodi helper
  private async joinUserRooms(client: Socket, userId: string) {
    // Unisciti a tutte le conversazioni dell'utente
    const conversations = await this.prisma.directConversationMember.findMany({
      where: { userId },
      include: { conversation: true },
    });

    for (const conv of conversations) {
      client.join(`conversation:${conv.directConversationId}`);
    }

    // Unisciti a tutti i canali dei workspace
    const workspaceMembers = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: { channels: true },
        },
      },
    });

    for (const member of workspaceMembers) {
      for (const channel of member.workspace.channels) {
        client.join(`channel:${channel.id}`);
      }
    }
  }

  private async updateUserStatus(userId: string, status: 'ONLINE' | 'OFFLINE') {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status,
        lastSeen: new Date(),
      },
    });

    // Notifica amici del cambio status
    this.notifyFriendsStatusChange(userId, status);
  }

  private async sendPushNotificationIfNeeded(
    conversationId: string,
    message: any,
  ) {
    // Trova l'altro utente nella conversazione
    const members = await this.prisma.directConversationMember.findMany({
      where: {
        directConversationId: conversationId,
        userId: { not: message.senderId },
      },
      include: { user: true },
    });

    for (const member of members) {
      // Se utente offline, invia push notification
      if (!this.userSockets.has(member.userId)) {
        // Implementa servizio push notifications
        // await this.pushService.sendNotification(member.userId, message);
      }
    }
  }

  private async validateToken(token: string): Promise<string | null> {
    // Implementa validazione JWT
    // return userId from token
    return 'user-id'; // placeholder
  }

  private async getUserFromSocket(client: Socket): Promise<string> {
    // Estrai userId dal socket
    return 'user-id'; // placeholder
  }

  private async notifyFriendsStatusChange(userId: string, status: string) {
    // Notifica amici del cambio status
    const friends = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    for (const friendship of friends) {
      const friendId =
        friendship.requesterId === userId
          ? friendship.receiverId
          : friendship.requesterId;
      const friendSockets = this.userSockets.get(friendId);

      if (friendSockets) {
        friendSockets.forEach((socket) => {
          socket.emit('friend_status_change', { userId, status });
        });
      }
    }
  }
}
