import { TaskStatus } from './task-status.type';

export interface Task {
  readonly id: number;
  readonly title: string;
  readonly description: string | null;
  readonly createdAt: string;
  readonly status: TaskStatus;
  readonly userId: number;
  readonly user?: {
    readonly name: string;
  }
}
