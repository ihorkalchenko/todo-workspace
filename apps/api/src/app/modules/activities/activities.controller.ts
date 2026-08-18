import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { Activity } from '@todo-workspace/tasks';

@Controller('tasks/:taskId/activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getActivities(@Param('taskId', ParseIntPipe) taskId: number): Promise<Activity[]> {
    return await this.activitiesService.getActivitiesForTask(taskId);
  }
}
