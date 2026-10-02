import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsHexColor()
  @IsNotEmpty()
  color: string;
}
