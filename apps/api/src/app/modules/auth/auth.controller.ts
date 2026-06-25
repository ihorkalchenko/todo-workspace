import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AUTH_ACCESS_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthResponse } from '@todo-workspace/shared-interfaces';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any): Promise<AuthResponse> {
    const user = await this.usersService.getUser(req.user.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    return { user };
  }

  @Post('signup')
  async signup(
    @Body() body: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const auth = await this.authService.signup(body.name, body.email, body.password);
    this.setCookie(res, auth.access_token, auth.refresh_token);

    return { user: auth.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const auth = await this.authService.login(body.email, body.password);
    this.setCookie(res, auth.access_token, auth.refresh_token);

    return { user: auth.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[AUTH_REFRESH_TOKEN_KEY];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const auth = await this.authService.refresh(refreshToken);
    this.setCookie(res, auth.access_token, auth.refresh_token);

    return { user: auth.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({  passthrough: true }) res: Response) {
    res.clearCookie(AUTH_ACCESS_TOKEN_KEY);
    res.clearCookie(AUTH_REFRESH_TOKEN_KEY);

    return { message: 'Logged out' };
  }

  private setCookie(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const accessTokenAge = parseInt(this.configService.get('JWT_MAX_AGE'), 10);
    const refreshTokenAge = parseInt(this.configService.get('JWT_REFRESH_MAX_AGE'), 10);

    res.cookie(AUTH_ACCESS_TOKEN_KEY, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: accessTokenAge,
    });

    res.cookie(AUTH_REFRESH_TOKEN_KEY, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: refreshTokenAge,
    });
  }
}
