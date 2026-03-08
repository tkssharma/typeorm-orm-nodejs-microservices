import { IsNumber, IsString, IsOptional, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Rating score', example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ description: 'Review title', example: 'Excellent post!', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Review content', example: 'This post really helped me understand NestJS better.' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'Post ID being reviewed', example: 1 })
  @IsNumber()
  postId!: number;

  @ApiProperty({ description: 'User ID of the reviewer', example: 1 })
  @IsNumber()
  userId!: number;
}
