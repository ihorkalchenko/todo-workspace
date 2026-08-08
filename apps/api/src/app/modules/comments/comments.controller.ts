import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { Comment } from '@todo-workspace/tasks';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  async getComments(@Param('taskId', ParseIntPipe) taskId: number): Promise<Comment[]> {
    return this.commentsService.getCommentsForTask(taskId);
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
