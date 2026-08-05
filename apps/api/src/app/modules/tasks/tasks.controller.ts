import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from '@todo-workspace/tasks';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MoveTaskDto } from './dto/move-task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getTasks(): Promise<Task[]> {
    return await this.tasksService.getTasks();
  }

  @Get(':id')
  async getTask(@Param('id', ParseIntPipe) id: number): Promise<Task> {
    const task = await this.tasksService.getTask(id);

    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    return task;
  }

  @Post()
  async createTask(@Body() data: Pick<Task, 'title' | 'description' | 'userId'>): Promise<Task> {
    return await this.tasksService.createTask(data);
  }

  @Patch(':id')
  async updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Pick<Task, 'title' | 'description' | 'status' | 'userId'>>
  ): Promise<Task> {
    const task = await this.tasksService.updateTask(id, data);

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  @Delete(':id')
  async deleteTask(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    const deleted = await this.tasksService.deleteTask(id);

    if (!deleted) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return { success: true };
  }

  @Patch(':id/move')
  async moveTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: MoveTaskDto,
  ): Promise<{ success: boolean }> {
    const success =  await this.tasksService.moveTask(id, data.status, data.order);

    if (!success) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    return { success: true };
  }
}
