import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AppController } from './app.controller';
import { SlackModule } from './modules/slack/slack.module';
import { StandupNotifierService } from './modules/slack/slack-standup.service';
import { GoogleStrategy } from './google.strategy';
import { GoogleAuthModule } from './modules/googleAuth/googleAuth.module';
import { PrismaModule } from './prisma/prisma.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FriendshipsModule } from './modules/friendships/friendships.module';
import { DirectConversationsModule } from './modules/direct-conversations/direct-conversations.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { PermissionsModule } from './modules/permissions/permissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ChannelsModule,
    MessagesModule,
    NotificationsModule,
    FriendshipsModule,
    DirectConversationsModule,
    ReactionsModule,
    AttachmentsModule,
    PermissionsModule,
    SlackModule,
    GoogleAuthModule,
  ],
  controllers: [AppController],
  providers: [StandupNotifierService],
})
export class AppModule {}
