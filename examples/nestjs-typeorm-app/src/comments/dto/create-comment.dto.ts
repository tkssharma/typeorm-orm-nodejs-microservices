import { IsString, IsEmail, IsNumber, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  authorName: string;

  @IsEmail()
  authorEmail: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsNumber()
  postId: number;

  @IsOptional()
  @IsNumber()
  parentId?: number;
}
