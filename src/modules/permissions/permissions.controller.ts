import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { Permission } from '../../../generated/prisma';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  async createPermission(
    @Body()
    data: {
      channelId: string;
      userId?: string;
      roleId?: string;
      type: Permission;
      allowed: boolean;
    },
  ) {
    return this.permissionsService.createPermission(data);
  }

  @Get('channel/:channelId')
  async getChannelPermissions(@Param('channelId') channelId: string) {
    return this.permissionsService.getPermissionsByChannel(channelId);
  }

  @Get('user/:channelId/:userId')
  async getUserPermissions(
    @Param('channelId') channelId: string,
    @Param('userId') userId: string,
  ) {
    return this.permissionsService.getUserPermissionsForChannel(
      channelId,
      userId,
    );
  }

  @Get('check/:channelId/:userId')
  async checkPermission(
    @Param('channelId') channelId: string,
    @Param('userId') userId: string,
    @Query('permission') permission: Permission,
  ) {
    return {
      allowed: await this.permissionsService.checkPermission(
        channelId,
        userId,
        permission,
      ),
    };
  }

  @Put(':id')
  async updatePermission(
    @Param('id') id: string,
    @Body('allowed') allowed: boolean,
  ) {
    return this.permissionsService.updatePermission(id, allowed);
  }

  @Delete(':id')
  async deletePermission(@Param('id') id: string) {
    return this.permissionsService.deletePermission(id);
  }

  @Post('bulk')
  async bulkCreatePermissions(
    @Body()
    data: {
      permissions: Array<{
        channelId: string;
        userId?: string;
        roleId?: string;
        type: Permission;
        allowed: boolean;
      }>;
    },
  ) {
    return {
      created: await this.permissionsService.bulkCreatePermissions(
        data.permissions,
      ),
    };
  }
}
