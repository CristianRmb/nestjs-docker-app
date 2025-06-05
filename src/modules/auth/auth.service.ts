import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import {
  RegisterUserInput,
  LoginUserInput,
  AuthResponse,
  UserPublic,
} from '../../types/prisma.types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterUserInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: registerDto.email }, { username: registerDto.username }],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'User with this email or username already exists',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        email: registerDto.email,
        password: hashedPassword,
        displayName: registerDto.displayName,
        bio: registerDto.bio,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        bio: true,
        status: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate JWT token
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        ...user,
        isOnline: false,
        timezone: null,
      },
    };
  }

  async login(loginDto: { email: string; password: string }) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last seen
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    });

    // Generate JWT token
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        status: true,
        bio: true,
        lastSeen: true,
        createdAt: true,
        _count: {
          select: {
            sentMessages: true,
            workspaceMembers: true,
            createdWorkspaces: true,
            friendsRequested: {
              where: { status: 'ACCEPTED' },
            },
            friendsReceived: {
              where: { status: 'ACCEPTED' },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        status: true,
      },
    });

    return user;
  }
}
