import { TaskPriority } from '@todo-workspace/tasks';

export interface CreateTaskDto {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  userId?: number;
  tagIds?: number[];
}
