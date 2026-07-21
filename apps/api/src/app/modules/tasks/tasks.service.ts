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

  async createTask(data: Pick<Task, 'title' | 'description' | 'userId'>): Promise<Task> {
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

      return task as Task;
    });
  }

  async updateTask(
    id: number,
    data: Partial<Pick<Task, 'title' | 'description' | 'status' | 'userId'>>
  ): Promise<Task | undefined> {
    const [task] = await this.db
      .update(schema.tasks)
      .set(data)
      .where(eq(schema.tasks.id, id))
      .returning();

    return task as Task | undefined;
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

  async moveTask(id: number, targetStatus: TaskStatus, targetOrder: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [task] = await tx
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.id, id));

      if (!task) throw new Error('Task not found');

      const sourceStatus = task.status;
      const sourceOrder = task.order;

      if (sourceStatus === targetStatus) {
        if (sourceOrder === targetOrder) return;

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
      }
    });
  }
}
