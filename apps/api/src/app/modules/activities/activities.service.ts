import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql} from 'drizzle-orm';
import { DRIZZLE } from '../../db/db.module';
import * as schema from '../../db/schemas';
import { PaginatedActivities } from '@todo-workspace/tasks';

@Injectable()
export class ActivitiesService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

  async getActivitiesForTask(
    taskId: number,
    page = 1,
    limit = 5,
  ): Promise<PaginatedActivities> {
    const offset = (page - 1) * limit;

    const data = await this.db.query.activities.findMany({
      where: eq(schema.activities.taskId, taskId),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      limit,
      offset,
      with: {
        user: {
          columns: { name: true },
        },
      },
    });

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.activities)
      .where(eq(schema.activities.taskId, taskId));

    const total = Number(count);
    const hasMore = offset + data.length < total;

    return {
      data: data as any,
      total,
      page,
      limit,
      hasMore,
    }
  }
}
