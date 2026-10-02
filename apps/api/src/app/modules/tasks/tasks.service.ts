import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, gt, gte, lt, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../db/db.module';
import * as schema from '../../db/schemas';

import { Task, TaskStatus } from '@todo-workspace/tasks';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

  async getTasks(): Promise<Task[]> {
    const result = await this.db.query.tasks.findMany({
      orderBy: (t, { asc }) => [asc(t.order), asc(t.id)],
      with: {
        user: { columns: { name: true } },
        taskTags: { with: { tag: true } },
      },
    });

    return result.map(({ taskTags, ...task }) => ({
      ...task,
      tags: taskTags?.map((tt) => tt.tag) ?? [],
    })) as unknown as Task[];
  }

  async getTask(id: number): Promise<Task | undefined> {
    const result = await this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, id),
      with: {
        user: { columns: { name: true } },
        taskTags: { with: { tag: true } },
      },
    });

    if (!result) return undefined;

    const { taskTags, ...task } = result;

    return {
      ...task,
      tags: taskTags?.map((tt) => tt.tag) ?? [],
    } as unknown as Task;
  }

  async createTask(userId: number, dto: CreateTaskDto): Promise<Task> {
    return this.db.transaction(async (tx) => {
      const [result] = await tx
        .select({ maxOrder:  sql<number>`coalesce(max(${schema.tasks.order}), -1)` })
        .from(schema.tasks)
        .where(eq(schema.tasks.status, 'To Do'));

      const nextOrder = (result?.maxOrder ?? -1) + 1;

      const [task] = await tx
        .insert(schema.tasks)
        .values({
          title: dto.title,
          description: dto.description,
          status: 'To Do',
          priority: dto.priority ?? 'Medium',
          order: nextOrder,
          userId: dto.userId,
        })
        .returning();

      if (dto.tagIds && dto.tagIds.length > 0) {
        await tx
          .insert(schema.taskTags)
          .values(
            dto.tagIds.map(tagId => ({
              taskId: task.id,
              tagId,
            }))
          );
      }

      await tx
        .insert(schema.activities)
        .values({
          taskId: task.id,
          userId,
          action: 'created',
        });

      return this.getTask(task.id) as Promise<Task>;
    });
  }

  async updateTask(userId: number, id: number, dto: UpdateTaskDto): Promise<Task | undefined> {
    return this.db.transaction(async (tx) => {
      const changes: string[] = [];
      const { tagIds, ...updateData } = dto;

      const [existedTask] = await tx
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.id, id));

      if (!existedTask) return undefined;

      if (tagIds !== undefined) {
        const oldTags = await tx
          .select({ tagId: schema.taskTags.tagId })
          .from(schema.taskTags)
          .where(eq(schema.taskTags.taskId, id));

        const oldTagIds = oldTags.map(t => t.tagId).sort();
        const newTagIds = [...tagIds].sort();

        const isTagChanged = oldTagIds.length !== newTagIds.length ||
          oldTagIds.some((val, index) => val !== newTagIds[index]);

        if (isTagChanged) {
          await tx
            .delete(schema.taskTags)
            .where(eq(schema.taskTags.taskId, id));

          if (tagIds.length > 0) {
            await tx
              .insert(schema.taskTags)
              .values(
                tagIds.map(tagId => ({
                  taskId: id,
                  tagId,
                }))
              );
          }

          changes.push('tags');
        }
      }

      let updatedTask = existedTask;

      if (Object.keys(updateData).length > 0) {
        const [res] = await tx
          .update(schema.tasks)
          .set(updateData)
          .where(eq(schema.tasks.id, id))
          .returning();

        if (!res) return undefined;
        updatedTask = res;
      }

      if (dto.title && dto.title !== existedTask.title) {
        changes.push(`title to "${dto.title}"`);
      }

      if (dto.description !== undefined && dto.description !== existedTask.description) {
        changes.push(`description to "${dto.description}"`);
      }

      if (dto.userId !== undefined && dto.userId !== existedTask.userId) {
        if (dto.userId === null) {
          changes.push('assignee to "Unassigned"');
        } else {
          const [assignedUser] = await tx
            .select({ name: schema.users.name })
            .from(schema.users)
            .where(eq(schema.users.id, dto.userId));

          const assigneeName = assignedUser?.name || "Unknown";
          changes.push(`assignee to "${assigneeName}"`);
        }
      }

      if (dto.status && dto.status !== existedTask.status) {
        changes.push(`status to "${dto.status}"`);
      }

      if (dto.priority && dto.priority !== existedTask.priority) {
        changes.push(`priority to "${dto.priority}"`);
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

      return updatedTask as Task;
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
