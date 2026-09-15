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
  Req,
  UseGuards,
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

  /**
   *  Create a new task
   *
   *  @param req - Request object containing authenticated user info
   *  @param data - Task creation payload containing title, description, priority and userId
   *  @returns The newly created Task object
   *
   *  @example
   *  POST /tasks
   *  Body: {
   *    "title": "Fix login bug",
   *    "description": "App crashes when entering invalid email",
   *    "priority": "High",
   *    "userId": 42
   *  }
   *  Response: {
   *    "id": 1,
   *    "title": "Fix login bug",
   *    "description": "App crashes when entering invalid email",
   *    "status": "To Do",
   *    "priority": "High",
   *    "order": 0,
   *    "createdAt": "2026-09-14T16:00:00Z",
   *    "userId": 42
   *  }
   * */
  @Post()
  async createTask(
    @Req() req: any,
    @Body() data: Pick<Task, 'title' | 'description' | 'priority' | 'userId'>,
  ): Promise<Task> {
    return await this.tasksService.createTask(req.user.id, data);
  }

  /**
   * Update an existing task
   *
   * @param id - The ID of the task to update
   * @param req - Request object containing authenticated user info
   * @param data - Partial task payload to update (title, description, status, priority, userId)
   * @returns The updated Task object
   * @throws NotFoundException if task with the given ID does not exist
   *
   * @example
   * PATCH /tasks/1
   * Body: {
   *   "priority": "Highest",
   *   "status": "Doing"
   * }
   * Response: {
   *   "id": 1,
   *   "title": "Fix login bug",
   *   "description": "App crashes when entering invalid email",
   *   "status": "Doing",
   *   "priority": "Highest",
   *   "order": 0,
   *   "createdAt": "2026-09-14T16:00:00Z",
   *   "userId": 42
   * }
   * */
  @Patch(':id')
  async updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() data: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'userId'>>,
  ): Promise<Task> {
    const task = await this.tasksService.updateTask(req.user.id, id, data);

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
    @Req() req: any,
    @Body() data: MoveTaskDto,
  ): Promise<{ success: boolean }> {
    const success =  await this.tasksService.moveTask(req.user.id, id, data.status, data.order);

    if (!success) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return { success: true };
  }
}
