import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TaskPriority } from '@todo-workspace/tasks';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['Lowest', 'Low', 'Medium', 'High', 'Highest'])
  priority?: TaskPriority;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tagIds?: number[];
}
