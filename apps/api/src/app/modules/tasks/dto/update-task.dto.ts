import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TaskPriority, TaskStatus } from '@todo-workspace/tasks';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['To Do', 'Doing', 'Done', 'Archived'])
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(['Lowest', 'Low', 'Medium', 'High', 'Highest'])
  priority?: TaskPriority;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tagIds?: number[];
}
