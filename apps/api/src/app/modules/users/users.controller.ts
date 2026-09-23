import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { join } from 'path';
import { unlink } from 'node:fs/promises';

import { User } from '@todo-workspace/users';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AvatarUploadInterceptor, RequestWithUser } from './interceptors/avatar-upload.interceptor';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(@Query('search') search?: string): Promise<User[]> {
    return await this.usersService.getUsers(search);
  }

  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.usersService.getUser(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Req() req: any, @Body() body: UpdateUserDto): Promise<User> {
    return await this.usersService.updateUser(req.user.id, body);
  }

  /**
   * Upload and update the profile avatar image for the authenticated user.
   *
   * @param req - The HTTP request object containing the authenticated user context (`req.user.id`)
   * @param file - Express.Multer.File object containing uploaded file metadata and disk filename
   * @returns Updated User object containing:
   *  - id: number
   *  - name: string
   *  - email: string
   *  - avatar: string relative path (e.g. "/uploads/avatars/avatar-42-1790072820994.jpg")
   *
   * @throws BadRequestException if the file extension is not an allowed image format (jpg, jpeg, png, webp) or exceeds 2MB limit
   *
   * @example
   * POST /users/me/avatar
   * Content-Type: multipart/form-data
   * Body: file = (binary image file)
   * Response: {
   *   "id": 42,
   *   "name": "Jane Doe",
   *   "email": "jane@example.com",
   *   "avatar": "/uploads/avatars/avatar-42-1790072820994.jpg"
   * }
   */
  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AvatarUploadInterceptor)
  async uploadAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const currentUser = await this.usersService.getUser(req.user.id);

    const avatarPath = `/uploads/avatars/${file.filename}`;
    const updatedUser = await this.usersService.updateUser(req.user.id, { avatar: avatarPath });

    if (currentUser?.avatar) {
      const oldFilePath = join(process.cwd(), currentUser.avatar);
      unlink(oldFilePath).catch((err) => {
        this.logger.warn(`Failed to delete old avatar: ${oldFilePath}`, err.message);
      });
    }

    return updatedUser;
  }
}
