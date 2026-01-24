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
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Get()
  findAll(@Query('includeDeleted') includeDeleted?: string) {
    return this.postsService.findAll(includeDeleted === 'true');
  }

  @Get('published')
  findPublished() {
    return this.postsService.findPublished();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const post = await this.postsService.findOne(id);
    await this.postsService.incrementViewCount(id);
    return post;
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const post = await this.postsService.findBySlug(slug);
    await this.postsService.incrementViewCount(post.id);
    return post;
  }

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, updatePostDto);
  }

  @Patch(':id/publish')
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.publish(id);
  }

  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.archive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.softRemove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.restore(id);
  }
}
