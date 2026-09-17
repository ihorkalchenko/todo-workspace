import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE } from '../../db/db.module';
import * as schema from '../../db/schemas'
import { Comment, PaginatedComments } from '@todo-workspace/tasks';

@Injectable()
export class CommentsService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

  async createComment(taskId: number, userId: number, content: string, parentId?: number): Promise<Comment> {
    return this.db.transaction(async (tx) => {
      const [newComment] = await tx
        .insert(schema.comments)
        .values({
          taskId,
          userId,
          content,
          parentId: parentId ?? null,
        })
        .returning();

      await tx
        .insert(schema.activities)
        .values({
          taskId,
          userId,
          action: parentId ? 'replied to a comment' : 'commented',
        });

      return tx.query.comments.findFirst({
        where: eq(schema.comments.id, newComment.id),
        with: {
          user: {
            columns: {
              name: true,
            },
          },
        },
      });
    });
  }

  async deleteComment(commentId: number, userId: number): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [comment] = await tx
        .select()
        .from(schema.comments)
        .where(
          and(
            eq(schema.comments.id, commentId),
            eq(schema.comments.userId, userId),
          )
        );

      if (!comment) return false;

      await tx
        .delete(schema.comments)
        .where(eq(schema.comments.id, commentId));

      await tx
        .insert(schema.activities)
        .values({
          taskId: comment.taskId,
          userId,
          action: 'deleted a comment',
        });

      return true;
    });
  }

  async getCommentsForTask(taskId: number, page = 1, limit = 5): Promise<PaginatedComments> {
    const offset = (page - 1) * limit;

    const data = await this.db.query.comments.findMany({
      where: and(
        eq(schema.comments.taskId, taskId),
        isNull(schema.comments.parentId)
      ),
      orderBy: (c, { asc }) => [asc(c.createdAt)],
      limit,
      offset,
      with: {
        user: {
          columns: {
            name: true,
          },
        },
        replies: {
          with: {
            user: {
              columns: {
                name: true,
              },
            },
          },
          orderBy: (c, { asc }) => [asc(c.createdAt)],
        }
      },
    });

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.comments)
      .where(
        and(
          eq(schema.comments.taskId, taskId),
          isNull(schema.comments.parentId)
        ),
      );

    const total = Number(count ?? 0);
    const hasMore = offset + data.length < total;

    return {
      data: data as Comment[],
      total,
      page,
      limit,
      hasMore,
    };
  }
}
