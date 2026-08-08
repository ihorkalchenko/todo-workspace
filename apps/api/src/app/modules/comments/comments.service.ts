import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE } from '../../db/db.module';
import * as schema from '../../db/schemas'
import { Comment } from '@todo-workspace/tasks';

@Injectable()
export class CommentsService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

  async createComment(taskId: number, userId: number, content: string): Promise<Comment> {
    const [newComment] = await this.db
      .insert(schema.comments)
      .values({
        taskId,
        userId,
        content,
      })
      .returning();

    return this.db.query.comments.findFirst({
      where: eq(schema.comments.id, newComment.id),
      with: {
        user: {
          columns: {
            name: true,
          },
        },
      },
    });
  }

  async deleteComment(commentId: number, userId: number): Promise<boolean> {
    const [deleteComment] = await this.db
      .delete(schema.comments)
      .where(
        and(
          eq(schema.comments.id, commentId),
          eq(schema.comments.userId, userId)
        )
      )
      .returning();

    return !!deleteComment;
  }

  async getCommentsForTask(taskId: number): Promise<Comment[]> {
    return this.db.query.comments.findMany({
      where: eq(schema.comments.taskId, taskId),
      orderBy: (c, { asc }) => [asc(c.createdAt)],
      with: {
        user: {
          columns: {
            name: true,
          },
        },
      },
    });
  }
}
