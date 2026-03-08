import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) { }

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now()
    );
  }

  async findAll(includeDeleted = false): Promise<Post[]> {
    return this.postRepository.find({
      withDeleted: includeDeleted,
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPublished(): Promise<Post[]> {
    return this.postRepository.find({
      where: { status: PostStatus.PUBLISHED },
      relations: ['author'],
      order: { publishedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'comments'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async findBySlug(slug: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { slug },
      relations: ['author', 'comments'],
    });

    if (!post) {
      throw new NotFoundException(`Post with slug ${slug} not found`);
    }

    return post;
  }

  async   create(createPostDto: CreatePostDto, authorId: number): Promise<Post> {
    const slug = this.generateSlug(createPostDto.title);
    const post = this.postRepository.create({
      ...createPostDto,
      slug,
      authorId,
    });
    return this.postRepository.save(post);
  }

  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    Object.assign(post, updatePostDto);
    return this.postRepository.save(post);
  }

  async publish(id: number): Promise<Post> {
    const post = await this.findOne(id);
    post.status = PostStatus.PUBLISHED;
    post.publishedAt = new Date();
    return this.postRepository.save(post);
  }

  async archive(id: number): Promise<Post> {
    const post = await this.findOne(id);
    post.status = PostStatus.ARCHIVED;
    return this.postRepository.save(post);
  }

  async softRemove(id: number): Promise<void> {
    const post = await this.findOne(id);
    await this.postRepository.softRemove(post);
  }

  async restore(id: number): Promise<Post> {
    await this.postRepository.restore(id);
    return this.findOne(id);
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.postRepository
      .createQueryBuilder()
      .update(Post)
      .set({ viewCount: () => '"viewCount" + 1' })
      .where('id = :id', { id })
      .execute();
  }
}
