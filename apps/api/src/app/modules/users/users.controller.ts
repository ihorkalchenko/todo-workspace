import {Controller, Get, NotFoundException, Param, ParseIntPipe, Query} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@todo-workspace/shared-interfaces';

@Controller('users')
export class UsersController {
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
}
