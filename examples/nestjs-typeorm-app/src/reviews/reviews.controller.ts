import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './review.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all reviews',
    description: 'Retrieves all reviews from the system with user and post relationships.',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved list of reviews',
    type: [Review],
    isArray: true,
  })
  async findAll(): Promise<Review[]> {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review found', type: Review })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Review> {
    return this.reviewsService.findOne(id);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get reviews by post ID' })
  @ApiParam({ name: 'postId', type: Number, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'List of reviews for post', type: [Review] })
  async findByPost(@Param('postId', ParseIntPipe) postId: number): Promise<Review[]> {
    return this.reviewsService.findByPost(postId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reviews by user ID' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of reviews by user', type: [Review] })
  async findByUser(@Param('userId', ParseIntPipe) userId: number): Promise<Review[]> {
    return this.reviewsService.findByUser(userId);
  }

  @Get('post/:postId/average')
  @ApiOperation({ summary: 'Get average rating for a post' })
  @ApiParam({ name: 'postId', type: Number, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Average rating for the post' })
  async getAverageRating(
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<{ averageRating: number }> {
    const averageRating = await this.reviewsService.getAverageRating(postId);
    return { averageRating };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new review',
    description: 'Creates a new review for a post. Each user can only review a post once.',
  })
  @ApiBody({
    type: CreateReviewDto,
    description: 'Review creation payload with rating (1-5) and optional content',
  })
  @ApiCreatedResponse({
    description: 'Review has been successfully created',
    type: Review,
  })
  @ApiConflictResponse({
    description: 'User has already submitted a review for this post',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data - validation failed',
  })
  async create(@Body() createReviewDto: CreateReviewDto): Promise<Review> {
    return this.reviewsService.create(createReviewDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update review by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review updated successfully', type: Review })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<Review> {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete review by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Review ID' })
  @ApiResponse({ status: 204, description: 'Review deleted successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.reviewsService.remove(id);
  }
}
