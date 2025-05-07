import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('/all')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // return this.usersService.findOne(id);
    // return a mock response for now
    return {
      id,
      name: 'John Doe',
      email: '',
    };
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    // return this.usersService.update(id, updateUserDto);
    // return a mock response for now
    return {
      id,
      ...updateUserDto,
    };
  }

  @Get('me')
  getMe() {
    return this.usersService.getMe(1);
  }
}
