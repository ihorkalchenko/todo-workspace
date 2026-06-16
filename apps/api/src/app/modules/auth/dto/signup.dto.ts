import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { MIN_NAME_LENGTH, MIN_PASSWORD_LENGTH } from '@todo-workspace/shared-interfaces';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(MIN_NAME_LENGTH)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  password!: string;
}
