import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '@todo-workspace/shared-interfaces';

interface InternalAuthResponse {
  readonly access_token: string;
  readonly user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(email: string, pass: string): Promise<InternalAuthResponse> {
    const user = await this.usersService.findByEmail(email);
    const compared = await bcrypt.compare(pass, user.password);

    if (user && compared) {
      const payload = { sub: user.id, email: user.email };

      return {
        access_token: await this.jwtService.signAsync(payload),
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
    const payload = { sub: user.id, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    };
  }
}
