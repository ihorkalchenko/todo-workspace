import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '@todo-workspace/shared-interfaces';

interface InternalAuthResponse {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, pass: string): Promise<InternalAuthResponse> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const compared = await bcrypt.compare(pass, user.password);

    if (compared) {
      const [access_token, refresh_token] = await this.generateTokens(user.id, user.email);

      return {
        access_token,
        refresh_token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async signup(name: string, email: string, password: string): Promise<InternalAuthResponse> {
    const isUserExist = await this.usersService.findByEmail(email);

    if (isUserExist) {
      throw new ConflictException('User with email already exists');
    }

    const user = await this.usersService.createUser({ name, email, password });
    const [access_token, refresh_token] = await this.generateTokens(user.id, user.email);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    };
  }

  async refresh(refreshToken: string): Promise<InternalAuthResponse> {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET');
    let payload;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, { secret });
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.getUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const [access_token, refresh_token] = await this.generateTokens(user.id, user.email);
    return { access_token, refresh_token, user };
  }

  private async generateTokens(userId: number, email: string): Promise<string[]> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ]);

    return [accessToken, refreshToken];
  }
}
