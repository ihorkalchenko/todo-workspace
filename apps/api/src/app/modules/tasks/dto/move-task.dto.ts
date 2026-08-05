import { IsEnum, IsInt, Min } from 'class-validator';
import { TaskStatus } from '@todo-workspace/tasks';

export class MoveTaskDto {
  @IsEnum(['To Do', 'Doing', 'Done', 'Archived'], {
    message: 'Status must be either "To Do", "Doing", "Done" or "Archived"',
  })
  status!: TaskStatus;

  @IsInt()
  @Min(0)
  order!: number;
}
