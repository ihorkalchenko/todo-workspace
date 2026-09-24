import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { Comment, PaginatedComments } from '@todo-workspace/tasks';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  /**
   * Retrieve paginated comments for a specific task.
   *
   * @param taskId - The ID of the task whose comments to retrieve
   * @param page - The page number to retrieve (1-based indexing). Defaults to 1.
   * @param limit - The maximum number of comments per page. Defaults to 5.
   * @returns PaginatedComments object containing:
   *  - data: array of Comment objects
   *  - total: total number of comments for the task
   *  - page: current page number
   *  - limit: number of items per page
   *  - hasMore: boolean indicating if more pages are available
   *
   * @example
   * GET /tasks/123/comments?page=2&limit=10
   * Response: {
   *   "data": [
   *     {
   *       "id": 5,
   *       "taskId": 123,
   *       "userId": 42,
   *       "content": "This is a comment",
   *       "createdAt": "2024-01-15T10:30:00Z",
   *       "user": { "name": "Alice" }
   *     }
   *   ],
   *   "total": 25,
   *   "page": 2,
   *   "limit": 10,
   *   "hasMore": true
   * }
   * */
  @Get()
  async getComments(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<PaginatedComments> {
    return this.commentsService.getCommentsForTask(taskId, page, limit);
  }

  /**
   * Create a new comment or reply for a specific task.
   *
   * @param taskId - The ID of the task to comment on
   * @param req - The HTTP request object containing the authenticated user context (`req.user.id`)
   * @param dto - CreateCommentDto
   * @returns Newly created Comment object containing:
   * - id: number
   * - taskId: number
   * - userId: number
   * - parentId: number | null
   * - content: string
   * - createdAt: string ISO timestamp
   * - user: object containing `{ name: string }`
   *
   * @throws NotFoundException if the target task with specified ID is not found
   *
   * @example
   * POST /tasks/123/comments
   * Body: {
   *   "content": "Great suggestion!",
   *   "parentId": 5
   * }
   * Response: {
   *   "id": 12,
   *   "taskId": 123,
   *   "userId": 42,
   *   "parentId": 5,
   *   "content": "Great suggestion!",
   *   "createdAt": "2026-09-17T11:00:00Z",
   *   "user": { "name": "Bob" }
   * }
   * */
  @Post()
  async create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentsService.createComment(
      taskId,
      req.user.id,
      dto.content,
      dto.parentId
    );

    if (!comment) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return comment;
  }

  /**
   * Update an existing comment by its ID.
   *
   * @param id - The ID of the comment to update
   * @param req - The HTTP request containing the authenticated user context (`req.user.id`)
   * @param dto - UpdateCommentDto containing the updated content
   * @returns Updated Comment object
   *
   * @throws NotFoundException if the comment with the specified ID is not found or
   * does not belong to the authenticated user
   *
   * @example
   * PATCH /tasks/123/comments/5
   * Body: {
   *   "content": "Updated comment content"
   * }
   * Response: {
   *   "id": 5,
   *   "taksId": 123,
   *   "userId": 42,
   *   "parentId": null,
   *   "content": "Updated comment content",
   *   "createdAt": "2026-09-17T11:00:00Z",
   *   "user": { "name": "Bob" }
   * }
   * */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentsService.updateComment(
      id,
      req.user.id,
      dto.content,
    );

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  /**
   * Delete a comment by its ID.
   *
   * @param id - The ID of the comment to delete
   * @param req - The HTTP request object containing the authenticated user context (`req.user.id`)
   * @returns Object containing:
   * - success: bookean indicating whether the comment was deleted
   *
   * @throws NotFoundException if a comment whith the specified ID is not found or does not belong to the authenticated user
   *
   * @example
   * DELETE /tasks/123/comments/5
   * Response: {
   *   "success": true
   * }
   * */
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<{ success: boolean }> {
    const success = await this.commentsService.deleteComment(id, req.user.id);

    if (!success) {
      throw new NotFoundException(`Comment not found with ID ${id}`);
    }

    return { success: true };
  }
}
