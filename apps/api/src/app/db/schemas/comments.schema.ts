import { integer, pgTable, serial, text, timestamp} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tasks } from './tasks.schema';
import { users } from './users.schema';

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id]
  }),
}));
