import { Inject, Injectable } from '@nestjs/common';
import { Task } from '@todo-workspace/shared-interfaces';
import { DRIZZLE } from '../../db/db.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class TasksService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

  async getTasks(): Promise<Task[]> {
    return this.db.query.tasks.findMany({
      orderBy: (t, { asc }) => asc(t.id),
      with: {
        user: {
          columns: {
            name: true,
          },
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
    const [task] = await this.db
      .insert(schema.tasks)
      .values({
        title: data.title,
        description: data.description,
        status: 'To Do',
        userId: data.userId,
      })
      .returning();

    return task as Task;
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
    const result = await this.db
      .delete(schema.tasks)
      .where(eq(schema.tasks.id, id))
      .returning();

    return result.length > 0;
  }
}
