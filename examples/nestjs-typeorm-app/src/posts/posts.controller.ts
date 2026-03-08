import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostByIdDto, UpdatePostDto } from './dto/update-post.dto';
import { Post as PostEntity } from './post.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all posts',
    description: 'Retrieves all posts from the system. Optionally includes soft-deleted posts when includeDeleted query parameter is true.',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Set to true to include soft-deleted posts in the results',
    example: false,
  })
  @ApiOkResponse({
    description: 'Successfully retrieved list of posts',
    type: [PostEntity],
    isArray: true,
  })
  findAll(@Query() options: QueryOperationDto): Promise<PostEntity[]> {
    return this.postsService.findAll(options.includeDeleted === 'true');
  }

  @Get('published')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all published posts',
    description: 'Retrieves only posts with PUBLISHED status, sorted by publication date.',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved list of published posts',
    type: [PostEntity],
    isArray: true,
  })
  findPublished(): Promise<PostEntity[]> {
    return this.postsService.findPublished();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get post by ID',
    description: 'Retrieves a single post by its unique identifier. Automatically increments the view count.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the post',
    required: true,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Post found and returned successfully',
    type: PostEntity,
  })
  @ApiNotFoundResponse({
    description: 'Post with the specified ID was not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid post ID format provided',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PostEntity> {
    const post = await this.postsService.findOne(id);
    await this.postsService.incrementViewCount(id);
    return post;
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get post by slug' })
  @ApiParam({ name: 'slug', type: String, description: 'Post slug' })
  @ApiResponse({ status: 200, description: 'Post found', type: PostEntity })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findBySlug(@Param('slug') slug: string) {
    const post = await this.postsService.findBySlug(slug);
    await this.postsService.incrementViewCount(post.id);
    return post;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new post',
    description: 'Creates a new blog post with the provided data. A unique slug will be generated from the title.',
  })
  @ApiBody({
    type: CreatePostDto,
    description: 'Post creation payload',
  })
  @ApiCreatedResponse({
    description: 'Post has been successfully created',
    type: PostEntity,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data - validation failed',
  })
  create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: JwtPayload): Promise<PostEntity> {
    return this.postsService.create(createPostDto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update post by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post updated successfully', type: PostEntity })
  @ApiResponse({ status: 404, description: 'Post not found' })
  update(
    @Param() params: UpdatePostByIdDto,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(params.id, updatePostDto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish post by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post published successfully', type: PostEntity })
  @ApiResponse({ status: 404, description: 'Post not found' })
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.publish(id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive post by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post archived successfully', type: PostEntity })
  @ApiResponse({ status: 404, description: 'Post not found' })
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.archive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete post by ID',
    description: 'Soft deletes a post. The post can be restored using the restore endpoint.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the post to delete',
    required: true,
    example: 1,
  })
  @ApiNoContentResponse({
    description: 'Post has been successfully soft deleted',
  })
  @ApiNotFoundResponse({
    description: 'Post with the specified ID was not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid post ID format provided',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.postsService.softRemove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted post by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post restored successfully', type: PostEntity })
  @ApiResponse({ status: 404, description: 'Post not found' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.restore(id);
  }
}
