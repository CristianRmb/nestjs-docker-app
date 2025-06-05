// Generated TypeScript types for Prisma models
// These types provide type safety for your Prisma database operations

import {
  UserStatus,
  WorkspaceRole,
  ChannelType,
  MessageType,
  NotificationType,
  FriendshipStatus,
  Permission,
} from '../../generated/prisma';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  displayName?: string | null;
  avatar?: string | null;
  bio?: string | null;
  status: UserStatus;
  lastSeen?: Date | null;
  isOnline: boolean;
  timezone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  creatorId: string;
  isPublic: boolean;
  inviteCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  roleId?: string | null;
  joinedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  workspaceId: string;
  isDefault: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Channel {
  id: string;
  name: string;
  description?: string | null;
  type: ChannelType;
  workspaceId: string;
  createdById: string;
  isPrivate: boolean;
  position: number;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  joinedAt: Date;
  lastReadAt?: Date | null;
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  channelId?: string | null;
  conversationId?: string | null;
  parentId?: string | null;
  isEdited: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DirectConversation {
  id: string;
  user1Id: string;
  user2Id: string;
  lastMessageAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  lastReadAt?: Date | null;
  joinedAt: Date;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  messageId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url?: string | null;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  relatedId?: string | null;
  createdAt: Date;
  readAt?: Date | null;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  workspaceId?: string | null;
  channelId?: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  mentionsOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelPermission {
  id: string;
  workspaceId: string;
  userId?: string | null;
  roleId?: string | null;
  channelId?: string | null;
  permission: Permission;
  allowed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Utility types for common operations
export type CreateUserInput = Omit<
  User,
  'id' | 'createdAt' | 'updatedAt' | 'isOnline' | 'lastSeen'
>;
export type UpdateUserInput = Partial<
  Pick<
    User,
    'username' | 'displayName' | 'avatar' | 'bio' | 'status' | 'timezone'
  >
>;

export type CreateWorkspaceInput = Omit<
  Workspace,
  'id' | 'createdAt' | 'updatedAt' | 'inviteCode'
>;
export type UpdateWorkspaceInput = Partial<
  Pick<Workspace, 'name' | 'description' | 'icon' | 'isPublic'>
>;

export type CreateChannelInput = Omit<
  Channel,
  'id' | 'createdAt' | 'updatedAt' | 'position'
>;
export type UpdateChannelInput = Partial<
  Pick<Channel, 'name' | 'description' | 'isPrivate' | 'position'>
>;

export type CreateMessageInput = Omit<
  Message,
  'id' | 'createdAt' | 'updatedAt' | 'isEdited' | 'isPinned'
>;
export type UpdateMessageInput = Pick<Message, 'content'>;

export type CreateNotificationInput = Omit<
  Notification,
  'id' | 'createdAt' | 'readAt' | 'isRead'
>;
export type UpdateNotificationSettingsInput = Partial<
  Omit<NotificationSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

// Extended types with relations
export interface UserWithWorkspaces extends User {
  workspaces: WorkspaceMember[];
}

export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[];
  channels: Channel[];
  owner: User;
}

export interface ChannelWithMembers extends Channel {
  members: ChannelMember[];
  messages: Message[];
  workspace: Workspace;
  createdBy: User;
}

export interface MessageWithRelations extends Message {
  author: User;
  channel?: Channel | null;
  conversation?: DirectConversation | null;
  reactions: MessageReaction[];
  attachments: Attachment[];
  replies: Message[];
  parent?: Message | null;
}

export interface ConversationWithMessages extends DirectConversation {
  messages: Message[];
  user1: User;
  user2: User;
  participants: ConversationParticipant[];
}

export interface NotificationWithRelations extends Notification {
  user: User;
}

export interface FriendshipWithUsers extends Friendship {
  requester: User;
  addressee: User;
}

// Authentication-related types
export interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  bio?: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: Omit<User, 'password'>;
}

export interface UserPublic extends Omit<User, 'password'> {}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  userId: string;
  username: string;
  email: string;
}
