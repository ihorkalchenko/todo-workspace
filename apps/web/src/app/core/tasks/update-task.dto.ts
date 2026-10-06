import { TaskStatus } from '@todo-workspace/tasks';
import { CreateTaskDto } from './create-task.dto';

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  status?: TaskStatus;
  order?: number;
}
