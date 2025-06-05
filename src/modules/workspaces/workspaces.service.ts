import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from '../../../generated/prisma';
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from '../../types/prisma.types';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async createWorkspace(data: CreateWorkspaceInput): Promise<Workspace> {
    // Validate that creatorId is provided
    if (!data.creatorId) {
      throw new Error('creatorId is required to create a workspace');
    }

    // Verify that the creator user exists
    const creator = await this.prisma.user.findUnique({
      where: { id: data.creatorId },
    });

    if (!creator) {
      throw new Error('Creator user not found');
    }

    // Create workspace with creator relationship
    const workspace = await this.prisma.workspace.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        isPublic: data.isPublic ?? false,
        inviteCode: this.generateInviteCode(),
        creator: {
          connect: {
            id: data.creatorId,
          },
        },
      },
      include: {
        creator: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Automatically add the creator as a workspace member
    await this.prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: data.creatorId,
      },
    });

    // Return the workspace with updated members
    return this.prisma.workspace.findUnique({
      where: { id: workspace.id },
      include: {
        creator: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    }) as Promise<Workspace>;
  }

  async updateWorkspace(
    id: string,
    data: UpdateWorkspaceInput,
  ): Promise<Workspace> {
    // Verify that the workspace exists
    const existingWorkspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    if (!existingWorkspace) {
      throw new Error('Workspace not found');
    }

    return this.prisma.workspace.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        isPublic: data.isPublic,
        updatedAt: new Date(),
      },
      include: {
        creator: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                avatar: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        channels: {
          include: {
            category: true,
          },
        },
        categories: {
          include: {
            channels: true,
          },
        },
      },
    });
  }

  async findWorkspacesByUser(userId: string): Promise<Workspace[]> {
    return this.prisma.workspace.findMany({
      where: {
        OR: [
          { creatorId: userId },
          {
            members: {
              some: {
                userId: userId,
                leftAt: null,
              },
            },
          },
        ],
      },
      include: {
        creator: true,
        members: {
          include: {
            user: true,
          },
        },
        channels: true,
        categories: true,
      },
    });
  }

  async findWorkspaceById(id: string): Promise<Workspace | null> {
    return this.prisma.workspace.findUnique({
      where: { id },
      include: {
        creator: true,
        members: {
          include: {
            user: true,
          },
        },
        channels: {
          include: {
            category: true,
          },
        },
        categories: {
          include: {
            channels: true,
          },
        },
      },
    });
  }

  async joinWorkspace(
    workspaceId: string,
    userId: string,
    inviteCode?: string,
  ): Promise<WorkspaceMember> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!workspace.isPublic && workspace.inviteCode !== inviteCode) {
      throw new Error('Invalid invite code');
    }

    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
      },
      include: {
        user: true,
        workspace: true,
      },
    });
  }

  async findAll(): Promise<Workspace[]> {
    return this.prisma.workspace.findMany({
      include: {
        creator: true,
        members: {
          include: {
            user: true,
          },
        },
        channels: true,
        categories: true,
      },
    });
  }

  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async addMemberToWorkspace(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole = WorkspaceRole.MEMBER,
  ): Promise<WorkspaceMember> {
    // Verify that the workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Verify that the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (existingMember && !existingMember.leftAt) {
      throw new Error('User is already a member of this workspace');
    }

    // If user was previously a member but left, update the existing record
    if (existingMember && existingMember.leftAt) {
      return this.prisma.workspaceMember.update({
        where: { id: existingMember.id },
        data: {
          role,
          leftAt: null,
          joinedAt: new Date(),
        },
        include: {
          user: true,
          workspace: true,
        },
      });
    }

    // Create new membership
    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role,
      },
      include: {
        user: true,
        workspace: true,
      },
    });
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    // Verify that the workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    return this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        leftAt: null, // Only active members
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            avatar: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // Owners first, then admins, etc.
        { joinedAt: 'asc' }, // Then by join date
      ],
    });
  }

  async removeMemberFromWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember> {
    // Verify that the workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Find the member
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member || member.leftAt) {
      throw new Error('User is not a member of this workspace');
    }

    // Don't allow removing the workspace creator
    if (workspace.creatorId === userId) {
      throw new Error('Cannot remove the workspace creator');
    }

    // Mark as left instead of deleting
    return this.prisma.workspaceMember.update({
      where: { id: member.id },
      data: {
        leftAt: new Date(),
      },
      include: {
        user: true,
        workspace: true,
      },
    });
  }
}
