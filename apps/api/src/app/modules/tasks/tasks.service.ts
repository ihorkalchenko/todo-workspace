import { Inject, Injectable } from '@nestjs/common';
import { Task, TaskStatus } from '@todo-workspace/tasks';
import { DRIZZLE } from '../../db/db.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { and, eq, gt, gte, lt, lte, sql } from 'drizzle-orm';

@Injectable()
export class TasksService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

  async getTasks(): Promise<Task[]> {
    return this.db.query.tasks.findMany({
      orderBy: (t, { asc }) => [asc(t.order), asc(t.id)],
      with: {
        user: {
          columns: { name: true },
        },
      },
    }) as unknown as Promise<Task[]>;
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, id),
      with: {
        user: {
          columns: {
            name: true,
          },
        },
      },
    }) as unknown as Promise<Task | undefined>;
  }

  async createTask(
    userId: number,
    data: Pick<Task, 'title' | 'description' | 'userId'>
  ): Promise<Task> {
    return this.db.transaction(async (tx) => {
      const [result] = await tx
        .select({ maxOrder:  sql<number>`coalesce(max(${schema.tasks.order}), -1)` })
        .from(schema.tasks)
        .where(eq(schema.tasks.status, 'To Do'));

      const nextOrder = (result?.maxOrder ?? -1) + 1;

      const [task] = await tx
        .insert(schema.tasks)
        .values({
          title: data.title,
          description: data.description,
          status: 'To Do',
          order: nextOrder,
          userId: data.userId,
        })
        .returning();

      await tx
        .insert(schema.activities)
        .values({
          taskId: task.id,
          userId,
          action: 'created',
        });

      return task as Task;
    });
  }

  async updateTask(
    userId: number,
    id: number,
    data: Partial<Pick<Task, 'title' | 'description' | 'status' | 'userId'>>
  ): Promise<Task | undefined> {
    return this.db.transaction(async (tx) => {
      const [existedTask] = await tx
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.id, id));

      if (!existedTask) return undefined;

      const [updatedTask] = await tx
        .update(schema.tasks)
        .set(data)
        .where(eq(schema.tasks.id, id))
        .returning();

      if (!updatedTask) return undefined;

      const changes: string[] = [];

      if (data.title && data.title !== existedTask.title) {
        changes.push(`title to "${data.title}"`);
      }

      if (data.description !== undefined && data.description !== existedTask.description) {
        changes.push('description');
      }

      if (data.userId !== undefined && data.userId !== existedTask.userId) {
        changes.push('assignee');
      }

      if (data.status && data.status !== existedTask.status) {
        changes.push(`status to "${data.status}"`);
      }

      if (changes.length > 0) {
        await tx
          .insert(schema.activities)
          .values({
            taskId: id,
            userId,
            action: 'updated',
            details: `Changed ${changes.join(', ')}`,
          });
      }

      return this.getTask(id);
    });
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [task] = await tx
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.id, id));

      if (!task) return false;

      await tx
        .delete(schema.tasks)
        .where(eq(schema.tasks.id, id));

      await tx
        .update(schema.tasks)
        .set({ order: sql`${schema.tasks.order} - 1` })
        .where(
          and(
            eq(schema.tasks.status, task.status),
            gt(schema.tasks.order, task.order),
          ),
        );
    });
  }

  async moveTask(
    userId: number,
    id: number,
    targetStatus: TaskStatus,
    targetOrder: number
  ): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [task] = await tx
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.id, id));

      if (!task) return false;

      const { status: sourceStatus, order: sourceOrder } = task;

      if (sourceStatus === targetStatus) {
        if (sourceOrder === targetOrder) return true;

        if (targetOrder > sourceOrder) {
          // decrement order for tasks shifted upward in the list
          await tx
            .update(schema.tasks)
            .set({ order: sql`${schema.tasks.order} - 1` })
            .where(
              and(
                eq(schema.tasks.status, sourceStatus),
                gt(schema.tasks.order, sourceOrder),
                lte(schema.tasks.order, targetOrder),
              ),
            );
        } else {
          // increment order for tasks shifted downward in the list
          await tx
            .update(schema.tasks)
            .set({ order: sql`${schema.tasks.order} + 1` })
            .where(
              and(
                eq(schema.tasks.status, sourceStatus),
                gte(schema.tasks.order, sourceOrder),
                lt(schema.tasks.order, targetOrder),
              ),
            );
        }

        // set the task's new order index
        await tx
          .update(schema.tasks)
          .set({ order: targetOrder })
          .where(eq(schema.tasks.id, id));

      } else {
        // 1. remove the gap from source column
        await tx
          .update(schema.tasks)
          .set({ order: sql`${schema.tasks.order} - 1` })
          .where(
            and(
              eq(schema.tasks.status, sourceStatus),
              gt(schema.tasks.order, sourceOrder),
            ),
          );

        // 2. Make space in destination column
        await tx
          .update(schema.tasks)
          .set({ order: sql`${schema.tasks.order} + 1` })
          .where(
            and(
              eq(schema.tasks.status, sourceStatus),
              gte(schema.tasks.order, sourceOrder),
            )
          );

        // 3. set moved task's new status & order
        await tx
          .update(schema.tasks)
          .set({ status: targetStatus, order: targetOrder })
          .where(eq(schema.tasks.id, id));

        await tx
          .insert(schema.activities)
          .values({
            taskId: id,
            userId,
            action: 'moved',
            details: `from "${sourceStatus}" to "${targetStatus}"`,
          });
      }

      return true;
    });
  }
}
