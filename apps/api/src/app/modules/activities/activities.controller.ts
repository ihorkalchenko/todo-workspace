import {
  Controller, DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe, Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { PaginatedActivities } from '@todo-workspace/tasks';

@Controller('tasks/:taskId/activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getActivities(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<PaginatedActivities> {
    return await this.activitiesService.getActivitiesForTask(taskId, page, limit);
  }
}
