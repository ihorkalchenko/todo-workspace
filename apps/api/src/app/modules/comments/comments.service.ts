import {BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DRIZZLE } from '../../db/db.module';
import * as schema from '../../db/schemas'
import { Comment, PaginatedComments } from '@todo-workspace/tasks';

@Injectable()
export class CommentsService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

  async createComment(taskId: number, userId: number, content: string, parentId?: number): Promise<Comment> {
    return this.db.transaction(async (tx) => {
      if (parentId) {
        const parentComment = await tx.query.comments.findFirst({
          where: and(
            eq(schema.comments.id, parentId),
            eq(schema.comments.taskId, taskId)
          ),
        });

        if (!parentComment) {
          throw new BadRequestException(
            `Parent comment with ID ${parentId} does not exist for task ${taskId}`
          );
        }
      }

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
    const allComments = await this.db.query.comments.findMany({
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

    const commentMap = new Map<number, Comment & { replies: Comment[] }>();
    const topLevelComments: Comment[] = [];

    for (const c of allComments) {
      commentMap.set(c.id, { ...(c as Comment), replies: [] });
    }

    for (const c of allComments) {
      const node = commentMap.get(c.id)!;

      if (c.parentId) {
        const parentNode = commentMap.get(c.parentId);

        if (parentNode) {
          parentNode.replies.push(node);
        } else {
          topLevelComments.push(node as Comment);
        }
      } else {
        topLevelComments.push(node as Comment);
      }
    }

    const total = topLevelComments.length;
    const offset = (page - 1) * limit;
    const paginatedTopLevel = topLevelComments.slice(offset, offset + limit);
    const hasMore = offset + paginatedTopLevel.length < total;

    return {
      data: paginatedTopLevel,
      total,
      page,
      limit,
      hasMore,
    };
  }
}
