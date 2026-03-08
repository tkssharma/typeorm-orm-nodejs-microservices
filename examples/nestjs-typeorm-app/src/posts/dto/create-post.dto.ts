import { IsString, IsOptional, MaxLength, MinLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'Post title', example: 'Getting Started with NestJS', minLength: 3, maxLength: 255 })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'Post content', example: 'This is the full content of the blog post...', minLength: 10 })
  @IsString()
  @MinLength(10)
  content!: string;

  @ApiPropertyOptional({ description: 'Short excerpt of the post', example: 'A brief introduction to NestJS framework', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;
}


export class QueryOperationDto {
  @ApiPropertyOptional({ description: 'Include soft-deleted posts', example: false })

  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean;
}