import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { MIN_NAME_LENGTH } from '@todo-workspace/constants';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(MIN_NAME_LENGTH)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
