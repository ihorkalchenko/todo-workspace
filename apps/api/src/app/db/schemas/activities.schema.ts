import { integer, pgTable, serial, text, timestamp} from 'drizzle-orm/pg-core';
import { relations} from 'drizzle-orm';
import { tasks } from './tasks.schema';
import { users } from './users.schema';

export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  task: one(tasks, {
    fields: [activities.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));
