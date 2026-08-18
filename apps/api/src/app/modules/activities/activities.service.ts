import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../db/db.module';
import * as schema from '../../db/schemas';
import { Activity } from '@todo-workspace/tasks';

@Injectable()
export class ActivitiesService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

  async getActivitiesForTask(taskId: number): Promise<Activity[]> {
    return this.db.query.activities.findMany({
      where: eq(schema.activities.taskId, taskId),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      with: {
        user: {
          columns: { name: true },
        },
      },
    });
  }
}
