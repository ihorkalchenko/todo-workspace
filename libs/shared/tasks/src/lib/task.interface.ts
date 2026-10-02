import { TaskStatus } from './task-status.type';
import { TaskPriority } from './task-priority.type';
import { Tag } from './tag.interface';

export interface Task {
  readonly id: number;
  readonly title: string;
  readonly description: string | null;
  readonly createdAt: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly userId: number;
  readonly tags?: Tag[];
  readonly user?: {
    readonly name: string;
  }
  order: number;
}
