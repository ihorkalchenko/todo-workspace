import {integer, pgEnum, pgTable, serial, text, timestamp} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { comments } from './comments.schema';
import { activities } from './activities.schema';

export const statusEnum = pgEnum('status', ['To Do', 'Doing', 'Done', 'Archived']);

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: statusEnum('status').default('To Do').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),

  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  comments: many(comments),
  activities: many(activities),
}));
