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
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * Fetch all tasks for the authenticated user
   *
   * @returns Array of Task objects with attached tags and assignee info
   */
  @Get()
  async getTasks(): Promise<Task[]> {
    return await this.tasksService.getTasks();
  }

  /**
   * Fetch a single task by ID
   *
   * @param id - The ID of the task to retrieve
   * @returns The requested Task object
   * @throws NotFoundException if task with the given ID does not exist
   */
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
   *  @param dto - Task creation payload
   *  @returns The newly created Task object
   *
   *  @example
   *  POST /tasks
   *  Body: {
   *    "title": "Fix login bug",
   *    "description": "App crashes when entering invalid email",
   *    "priority": "High",
   *    "userId": 42,
   *    "tagIds": [1, 2]
   *  }
   *  Response: {
   *    "id": 1,
   *    "title": "Fix login bug",
   *    "description": "App crashes when entering invalid email",
   *    "status": "To Do",
   *    "priority": "High",
   *    "order": 0,
   *    "createdAt": "2026-09-14T16:00:00Z",
   *    "userId": 42,
   *    "tags": [
   *      { "id": 1, "name": "Bug", "color": "#EF4444" },
   *      { "id": 2, "name": "Auth", "color": "#3B82F6" }
   *    ]
   *  }
   * */
  @Post()
  async createTask(@Req() req: any, @Body() dto: CreateTaskDto): Promise<Task> {
    return await this.tasksService.createTask(req.user.id, dto);
  }

  /**
   * Update an existing task
   *
   * @param id - The ID of the task to update
   * @param req - Request object containing authenticated user info
   * @param dto - Partial task fields to update
   * @returns The updated Task object
   * @throws NotFoundException if task with the given ID does not exist
   *
   * @example
   * PATCH /tasks/1
   * Body: {
   *   "priority": "Highest",
   *   "status": "Doing",
   *   "tagIds": [1, 3]
   * }
   * Response: {
   *   "id": 1,
   *   "title": "Fix login bug",
   *   "description": "App crashes when entering invalid email",
   *   "status": "Doing",
   *   "priority": "Highest",
   *   "order": 0,
   *   "createdAt": "2026-09-14T16:00:00Z",
   *   "userId": 42,
   *   "tags": [
   *     { "id": 1, "name": "Bug", "color": "#EF4444" },
   *     { "id": 3, "name": "Frontend", "color": "#108981" }
   *   ]
   * }
   * */
  @Patch(':id')
  async updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.tasksService.updateTask(req.user.id, id, dto);

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  /**
   * Delete a task by ID
   *
   * @param id - The ID of the task to delete
   * @returns Object indicating success status
   * @throws NotFoundException if task with the given ID does not exist
   */
  @Delete(':id')
  async deleteTask(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    const deleted = await this.tasksService.deleteTask(id);

    if (!deleted) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return { success: true };
  }

  /**
   * Move/reorder a task accross Kanban columns or list positions
   *
   * @param id - The ID of the task to move
   * @param req - Request object containing authenticated user info
   * @param dto - Task moving payload
   * @returns Object indicating success status
   * @throws NotFoundException if task with the given ID does not exist
   */
  @Patch(':id/move')
  async moveTask(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: MoveTaskDto,
  ): Promise<{ success: boolean }> {
    const success =  await this.tasksService.moveTask(req.user.id, id, dto.status, dto.order);

    if (!success) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return { success: true };
  }
}
