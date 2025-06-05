import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Patch,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserInput, UpdateUserInput } from '../../types/prisma.types';
import { UserStatus } from '../../../generated/prisma';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  async searchUsers(
    @Query('query') query: string,
    @Query('limit') limit?: string,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter is required');
    }

    const limitNumber = limit ? parseInt(limit, 10) : 20;
    if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    return this.usersService.searchUsers(query.trim(), limitNumber);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get(':id/stats')
  async getUserStats(@Param('id') id: string) {
    const stats = await this.usersService.getUserStats(id);
    if (!stats) {
      throw new NotFoundException('User not found');
    }
    return stats;
  }

  @Get(':id/workspaces')
  async getUserWithWorkspaces(@Param('id') id: string) {
    const user = await this.usersService.getUserWithWorkspaces(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get('username/:username')
  async findByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Post()
  async create(@Body() createUserDto: CreateUserInput) {
    try {
      return await this.usersService.create(createUserDto);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Email or username already exists');
      }
      throw error;
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserInput,
  ) {
    try {
      return await this.usersService.update(id, updateUserDto);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Email or username already exists');
      }
      throw error;
    }
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: { status: UserStatus },
  ) {
    if (!Object.values(UserStatus).includes(statusDto.status)) {
      throw new BadRequestException('Invalid status value');
    }

    try {
      return await this.usersService.updateStatus(id, statusDto.status);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      return await this.usersService.delete(id);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  @Get(':id/friends')
  async getUserFriends(@Param('id') id: string) {
    const user = await this.usersService.getUserFriends(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get(':id/conversations')
  async getUserDirectConversations(@Param('id') id: string) {
    return this.usersService.getUserDirectConversations(id);
  }

  @Get(':id/activity')
  async getUserActivity(@Param('id') id: string, @Query('days') days?: string) {
    const daysNumber = days ? parseInt(days, 10) : 30;
    if (isNaN(daysNumber) || daysNumber < 1 || daysNumber > 365) {
      throw new BadRequestException('Days must be between 1 and 365');
    }

    return this.usersService.getUserActivity(id, daysNumber);
  }

  @Get(':id/notifications')
  async getUserNotifications(
    @Param('id') id: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const takeNumber = take ? parseInt(take, 10) : 20;
    const skipNumber = skip ? parseInt(skip, 10) : 0;

    if (isNaN(takeNumber) || takeNumber < 1 || takeNumber > 100) {
      throw new BadRequestException('Take must be between 1 and 100');
    }

    if (isNaN(skipNumber) || skipNumber < 0) {
      throw new BadRequestException('Skip must be 0 or greater');
    }

    return this.usersService.getUserNotifications(id, takeNumber, skipNumber);
  }

  @Get(':id/profile')
  async getUserProfile(@Param('id') id: string) {
    const profile = await this.usersService.getUserProfile(id);
    if (!profile) {
      throw new NotFoundException('User not found');
    }
    return profile;
  }

  @Get('check/username/:username')
  async checkUsernameAvailability(@Param('username') username: string) {
    if (!username || username.trim().length < 3) {
      throw new BadRequestException('Username must be at least 3 characters');
    }
    return this.usersService.checkUsernameAvailability(username.trim());
  }

  @Get('check/email/:email')
  async checkEmailAvailability(@Param('email') email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
    return this.usersService.checkEmailAvailability(email);
  }

  @Patch(':id/last-seen')
  async updateLastSeen(@Param('id') id: string) {
    try {
      return await this.usersService.updateLastSeen(id);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  @Patch('bulk/status')
  async bulkUpdateStatus(
    @Body() bulkUpdateDto: { userIds: string[]; status: UserStatus },
  ) {
    if (
      !Array.isArray(bulkUpdateDto.userIds) ||
      bulkUpdateDto.userIds.length === 0
    ) {
      throw new BadRequestException(
        'UserIds array is required and cannot be empty',
      );
    }

    if (bulkUpdateDto.userIds.length > 100) {
      throw new BadRequestException(
        'Cannot update more than 100 users at once',
      );
    }

    if (!Object.values(UserStatus).includes(bulkUpdateDto.status)) {
      throw new BadRequestException('Invalid status value');
    }

    return this.usersService.bulkUpdateStatus(
      bulkUpdateDto.userIds,
      bulkUpdateDto.status,
    );
  }
}
