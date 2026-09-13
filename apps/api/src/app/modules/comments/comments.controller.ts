import {
  Body,
  Controller, DefaultValuePipe,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post, Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { Comment, PaginatedComments } from '@todo-workspace/tasks';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

/**
 * TODO: there are the next things that should be done:
 * 1. add edit/update endpoint,
 * 2. add reply endpoint
 *
 * */
@Controller('tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  /**
   * TODO: implement load more chunks
   * */
  @Get()
  async getComments(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<PaginatedComments> {
    return this.commentsService.getCommentsForTask(taskId, page, limit);
  }

  @Post()
  async create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentsService.createComment(taskId, req.user.id, dto.content);

    if (!comment) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return comment;
  }

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
