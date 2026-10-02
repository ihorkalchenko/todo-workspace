import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { tasks } from './tasks.schema';
import { tags } from './tags.schema';

export const taskTags = pgTable(
  'task_tags',
  {
    taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.tagId] })
  ]
);

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, {
    fields: [taskTags.taskId],
    references: [tasks.id],
  }),
  tag: one(tags, {
    fields: [taskTags.tagId],
    references: [tags.id],
  }),
}));
