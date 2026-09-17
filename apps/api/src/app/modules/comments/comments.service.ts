import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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

  /**
   * TODO: Optimize comment retrieval for large threads.
   * Currently, all comments for the task are loaded and the nested tree is built
   * in memory before top-level pagination is applied. Consider paginating
   * top-level comments in the database and loading replies only for visible
   * comment threads to reduce database load and memory usage.
   * */
  async getCommentsForTask(taskId: number, page = 1, limit = 5): Promise<PaginatedComments> {
    const offset = (page - 1) * limit;

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.comments)
      .where(
        and(
          eq(schema.comments.taskId, taskId),
          isNull(schema.comments.parentId),
        ),
      );

    const total = Number(count ?? 0);

    if (total === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      };
    }

    const paginatedTopComments = await this.db.query.comments.findMany({
      where: and(
        eq(schema.comments.taskId, taskId),
        isNull(schema.comments.parentId),
      ),
      orderBy: (c, { asc }) => [asc(c.createdAt)],
      limit,
      offset,
      columns: { id: true },
    });

    if (paginatedTopComments.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      };
    }

    const allComments = await this.db.query.comments.findMany({
      where: eq(schema.comments.taskId, taskId),
      orderBy: (c, { asc }) => [asc(c.createdAt)],
      with: {
        user: { columns: { name: true } },
      },
    });

    const commentMap = new Map<number, Comment & { replies: Comment[] }>();

    for (const c of allComments) {
      commentMap.set(c.id, { ...(c as Comment), replies: [] });
    }

    for (const c of allComments) {
      const node = commentMap.get(c.id)!;

      if (c.parentId) {
        const parentNode = commentMap.get(c.parentId);

        if (parentNode) {
          parentNode.replies.push(node);
        }
      }
    }

    const paginatedTree = paginatedTopComments
      .map((c) => commentMap.get(c.id)!)
      .filter((c) => c !== undefined);

    const hasMore = offset + paginatedTree.length < total;

    return {
      data: paginatedTree,
      total,
      page,
      limit,
      hasMore,
    };
  }
}
