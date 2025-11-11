import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponseDto, UserResponseDto } from './dto';
import { Role, AdminTitle } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private comparePassword(password: string, hashedPassword: string): boolean {
    const hash = this.hashPassword(password);
    return hash === hashedPassword;
  }

  private generateToken(userId: string, email: string, role: Role): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    if ((dto.role === Role.ADMIN || dto.role === Role.ADMINISTRATOR) && !dto.adminTitle) {
      throw new BadRequestException('Admin role requires an admin title');
    }

    if (dto.role === Role.USER && dto.adminTitle) {
      throw new BadRequestException('User role cannot have admin title');
    }

    const hashedPassword = this.hashPassword(dto.password);

    // Create user with isApproved = false (pending approval)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        role: dto.role || Role.USER,
        adminTitle: dto.adminTitle,
        isApproved: false, // Requires admin approval
      },
    });

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      adminTitle: user.adminTitle ?? undefined,
      accessToken,
      isApproved: user.isApproved,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = this.comparePassword(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is approved
    if (!user.isApproved) {
      throw new UnauthorizedException('Your account is pending approval. Please wait for administrator approval.');
    }

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      adminTitle: user.adminTitle ?? undefined,
      accessToken,
      isApproved: user.isApproved,
    };
  }

  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      adminTitle: userWithoutPassword.adminTitle ?? undefined,
    };
  }

  async validateUser(userId: string): Promise<UserResponseDto> {
    return this.getUserById(userId);
  }
}
