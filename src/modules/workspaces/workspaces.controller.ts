import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceInput } from '../../types/prisma.types';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async findAll() {
    return this.workspacesService.findAll();
  }

  @Post()
  async createWorkspace(@Body() createWorkspaceDto: CreateWorkspaceDto) {
    // Validate required fields
    if (!createWorkspaceDto.name) {
      throw new BadRequestException('Workspace name is required');
    }
    if (!createWorkspaceDto.creatorId) {
      throw new BadRequestException('creatorId is required');
    }

    try {
      // Convert DTO to service input with proper defaults
      const workspaceInput = {
        ...createWorkspaceDto,
        isPublic: createWorkspaceDto.isPublic ?? false,
      };
      return await this.workspacesService.createWorkspace(workspaceInput);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('user/:userId')
  findWorkspacesByUser(@Param('userId') userId: string) {
    return this.workspacesService.findWorkspacesByUser(userId);
  }

  @Get(':id')
  findWorkspaceById(@Param('id') id: string) {
    return this.workspacesService.findWorkspaceById(id);
  }

  @Post(':id/join')
  joinWorkspace(
    @Param('id') workspaceId: string,
    @Body() joinDto: { userId: string; inviteCode?: string },
  ) {
    return this.workspacesService.joinWorkspace(
      workspaceId,
      joinDto.userId,
      joinDto.inviteCode,
    );
  }

  @Put(':id')
  async updateWorkspace(
    @Param('id') id: string,
    @Body()
    updateWorkspaceDto: UpdateWorkspaceInput,
  ) {
    try {
      return await this.workspacesService.updateWorkspace(
        id,
        updateWorkspaceDto,
      );
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Workspace not found');
      }
      throw new BadRequestException(error.message);
    }
  }
}
