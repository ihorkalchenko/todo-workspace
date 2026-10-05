import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../db/db.module';
import * as schema from '../../db/schemas';

import { Tag } from '@todo-workspace/tasks';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

  async findAllForUser(userId:number): Promise<Tag[]> {
    return this.db.query.tags.findMany({
      where: eq(schema.tags.userId, userId),
    }) as unknown as Promise<Tag[]>;
  }

  async create(userId:number, dto: CreateTagDto): Promise<Tag> {
    const [tag] = await this.db
      .insert(schema.tags)
      .values({
        name: dto.name,
        color: dto.color,
        userId,
      })
      .returning();

    return tag;
  }

  async delete(userId:number, tagId:number): Promise<boolean> {
    const result = await this.db
      .delete(schema.tags)
      .where(
        and(
          eq(schema.tags.id, tagId),
          eq(schema.tags.userId, userId),
        ));

    if (result.rowCount === 0) {
      throw new NotFoundException('No tag found.');
    }

    return true;
  }
}
