import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // return this.authService.register(createUserDto);
    // return a mock response for now
    return {
      message: 'User registered successfully',
      user: createUserDto,
    };
  }

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    // return this.authService.login(loginDto);
    // return a mock response for now
    return {
      message: 'User logged in successfully',
      user: { username: loginDto.username },
    };
  }
}
