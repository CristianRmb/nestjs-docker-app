import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Workspace, WorkspaceMember } from '../../../generated/prisma';
import { CreateWorkspaceInput } from '../../types/prisma.types';

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
    data: Partial<CreateWorkspaceInput>,
  ): Promise<Workspace> {
    return this.prisma.workspace.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
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
}
