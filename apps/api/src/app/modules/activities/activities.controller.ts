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

  /**
   * Retrieve paginated activity logs for a specific task.
   *
   * @param taskId - The ID of the task whose activity history to retrieve
   * @param page - The page number to retrieve (1-based indexing)
   * @param limit - The maximum number of activities per page
   * @returns PaginatedActivities object containing:
   *   - data: array of Activity objects
   *   - total: total number of activity records for the task
   *   - page: current page number
   *   - limit: number of items per page
   *   - hasMore: boolean indicating if more pages are available
   *
   * @example
   * GET /tasks/123/activities?page=2&limit=5
   * Response: {
   *   "data": [
   *     {
   *       "id": 10,
   *       "taskId": 123,
   *       "action": "commented",
   *       "details": null,
   *       "createdAt": "2026-01-15T10:00:00Z",
   *       "user": { "name": "Alice" }
   *     }
   *   ],
   *   "total": 15,
   *   "page": 2,
   *   "limit": 5,
   *   "hasMore": true
   * }
   * */
  @Get()
  async getActivities(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<PaginatedActivities> {
    return await this.activitiesService.getActivitiesForTask(taskId, page, limit);
  }
}
