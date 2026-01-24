import { IsString, IsOptional, MaxLength, MinLength, IsEnum } from 'class-validator';
import { PostStatus } from '../post.entity';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
