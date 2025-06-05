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
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  allowEIO3: true,
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
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Get token from multiple possible sources
      let token: string | null = null;

      // Check auth object (Socket.IO standard)
      if (client.handshake.auth?.token) {
        token = client.handshake.auth.token;
      }
      // Check query parameters (common for WebSocket clients)
      else if (client.handshake.query?.token) {
        token = client.handshake.query.token as string;
      }
      // Check authorization header (HTTP standard)
      else if (client.handshake.headers?.authorization) {
        token = client.handshake.headers.authorization;
      }

      console.log('WebSocket connection attempt:', {
        auth: client.handshake.auth,
        query: client.handshake.query,
        headers: client.handshake.headers,
        token: token ? 'Token present' : 'No token found',
      });

      const userId = await this.validateToken(token);

      if (!userId) {
        console.log('WebSocket connection rejected: Invalid or missing token');
        client.emit('error', {
          message:
            'Authentication failed. Please provide a valid JWT token in auth.token, query.token, or Authorization header.',
        });
        client.disconnect();
        return;
      }

      // Store userId in socket data
      client.data.userId = userId;

      // Associate socket with user
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(client);

      // Join user to their conversation rooms
      await this.joinUserRooms(client, userId);

      // Update user status
      await this.updateUserStatus(userId, 'ONLINE');

      console.log(`User ${userId} connected via WebSocket successfully`);

      // Send connection confirmation
      client.emit('connected', {
        userId,
        message: 'Successfully connected to WebSocket',
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      client.emit('error', { message: 'Connection failed: ' + error.message });
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

  private async validateToken(token: string | null): Promise<string | null> {
    try {
      if (!token) return null;

      // Remove Bearer prefix if present
      const cleanToken = token.replace('Bearer ', '');

      const payload = this.jwtService.verify(cleanToken);
      return payload.sub; // userId
    } catch (error) {
      console.error('Token validation failed:', error.message);
      return null;
    }
  }

  private async getUserFromSocket(client: Socket): Promise<string> {
    // Get userId from socket data stored during connection
    return client.data.userId;
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
