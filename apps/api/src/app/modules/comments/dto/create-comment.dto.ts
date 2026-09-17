import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Comment cannot exceed 5000 characters' })
  content: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;
}
