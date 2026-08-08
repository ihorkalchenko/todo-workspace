import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tasks } from './tasks.schema';
import { comments } from './comments.schema';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  comments: many(comments),
}));
