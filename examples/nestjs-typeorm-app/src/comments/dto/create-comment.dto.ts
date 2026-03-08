import { IsString, IsEmail, IsNumber, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment author name', example: 'Jane Smith', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  authorName!: string;

  @ApiProperty({ description: 'Comment author email', example: 'jane.smith@example.com' })
  @IsEmail()
  authorEmail!: string;

  @ApiProperty({ description: 'Comment content', example: 'Great article! Very helpful.', minLength: 1 })
  @IsString()
  @MinLength(1)
  content!: string;

  @ApiProperty({ description: 'Post ID to comment on', example: 1 })
  @IsNumber()
  postId!: number;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies', example: 5 })
  @IsOptional()
  @IsNumber()
  parentId?: number;
}
