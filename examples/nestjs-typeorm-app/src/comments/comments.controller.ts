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
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './comment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @Get('post/:postId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get comments by post ID',
    description: 'Retrieves all comments for a specific post. By default only approved comments are returned.',
  })
  @ApiParam({
    name: 'postId',
    type: Number,
    description: 'Unique identifier of the post',
    required: true,
    example: 1,
  })
  @ApiQuery({
    name: 'all',
    required: false,
    type: Boolean,
    description: 'Set to true to include unapproved comments',
    example: false,
  })
  @ApiOkResponse({
    description: 'Successfully retrieved list of comments',
    type: [Comment],
    isArray: true,
  })
  findByPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('all') all?: string,
  ): Promise<Comment[]> {
    return this.commentsService.findByPost(postId, all !== 'true');
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending comments' })
  @ApiResponse({ status: 200, description: 'List of pending comments', type: [Comment] })
  getPending() {
    return this.commentsService.getPendingComments();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment found', type: Comment })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new comment',
    description: 'Creates a new comment on a post. Comments require approval before being publicly visible.',
  })
  @ApiBody({
    type: CreateCommentDto,
    description: 'Comment creation payload',
  })
  @ApiCreatedResponse({
    description: 'Comment has been successfully created',
    type: Comment,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data - validation failed',
  })
  create(@Body() createCommentDto: CreateCommentDto): Promise<Comment> {
    return this.commentsService.create(createCommentDto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve comment by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment approved successfully', type: Comment })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.approve(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete comment by ID',
    description: 'Permanently removes a comment. This action cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the comment to delete',
    required: true,
    example: 1,
  })
  @ApiNoContentResponse({
    description: 'Comment has been successfully deleted',
  })
  @ApiNotFoundResponse({
    description: 'Comment with the specified ID was not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid comment ID format provided',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.commentsService.remove(id);
  }
}
