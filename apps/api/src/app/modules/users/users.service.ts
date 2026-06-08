import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../../db/db.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { User } from '@todo-workspace/shared-interfaces';
import { eq, getTableColumns, ilike } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

type UserWithPassword = typeof schema.users.$inferSelect;

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

  async getUsers(search?: string): Promise<User[]> {
    const { password, ...rest } = getTableColumns(schema.users);

    return this.db
      .select({ ...rest })
      .from(schema.users)
      .where(search ? ilike(schema.users.name, `%${search}%`) : undefined);
  }

  async getUser(id: number): Promise<User | undefined> {
    const { password, ...rest } = getTableColumns(schema.users);
    const [user] = await this.db
      .select({ ...rest })
      .from(schema.users)
      .where(eq(schema.users.id, id));

    return user as User | undefined;
  }

  async findByEmail(email: string): Promise<UserWithPassword | undefined> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));

    return user;
  }

  async createUser(data: Pick<typeof schema.users.$inferInsert, 'name' | 'email' | 'password'>): Promise<User> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const { password, ...returningFields } = getTableColumns(schema.users);

    const [user] = await this.db
      .insert(schema.users)
      .values({
        ...data,
        password: hashedPassword,
      }).returning({ ...returningFields });

    return user;
  }
}
