import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { AuthResponse } from '@todo-workspace/shared-interfaces';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(email: string, pass: string): Promise<AuthResponse> {
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
}
