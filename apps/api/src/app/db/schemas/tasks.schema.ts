import {integer, pgEnum, pgTable, serial, text, timestamp} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const statusEnum = pgEnum('status', ['To Do', 'Doing', 'Done']);

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: statusEnum('status').default('To Do').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),

  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));
