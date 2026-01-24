import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Post, PostStatus } from '../entities/Post';

export class PostService {
  private postRepository: Repository<Post>;

  constructor() {
    this.postRepository = AppDataSource.getRepository(Post);
  }

  async findAll(includeDeleted = false): Promise<Post[]> {
    if (includeDeleted) {
      return this.postRepository.find({
        withDeleted: true,
        relations: ['author'],
        order: { createdAt: 'DESC' },
      });
    }
    return this.postRepository.find({
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

  async findById(id: number): Promise<Post | null> {
    return this.postRepository.findOne({
      where: { id },
      relations: ['author', 'comments'],
    });
  }

  async findBySlug(slug: string): Promise<Post | null> {
    return this.postRepository.findOne({
      where: { slug },
      relations: ['author', 'comments'],
    });
  }

  async findByAuthor(authorId: number): Promise<Post[]> {
    return this.postRepository.find({
      where: { authorId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Post>): Promise<Post> {
    const post = this.postRepository.create(data);
    return this.postRepository.save(post);
  }

  async update(id: number, data: Partial<Post>): Promise<Post | null> {
    const post = await this.findById(id);
    if (!post) return null;

    Object.assign(post, data);
    return this.postRepository.save(post);
  }

  async publish(id: number): Promise<Post | null> {
    return this.update(id, {
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
    });
  }

  async archive(id: number): Promise<Post | null> {
    return this.update(id, { status: PostStatus.ARCHIVED });
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.postRepository.softDelete(id);
    return result.affected !== 0;
  }

  async restore(id: number): Promise<boolean> {
    const result = await this.postRepository.restore(id);
    return result.affected !== 0;
  }

  async hardDelete(id: number): Promise<boolean> {
    const result = await this.postRepository.delete(id);
    return result.affected !== 0;
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.postRepository
      .createQueryBuilder()
      .update(Post)
      .set({ viewCount: () => '"viewCount" + 1' })
      .where('id = :id', { id })
      .execute();
  }

  async searchPosts(query: string): Promise<Post[]> {
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.title ILIKE :query', { query: `%${query}%` })
      .orWhere('post.content ILIKE :query', { query: `%${query}%` })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .orderBy('post.publishedAt', 'DESC')
      .getMany();
  }

  async getPostStats(): Promise<any> {
    return this.postRepository
      .createQueryBuilder('post')
      .select('post.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(post.viewCount)', 'totalViews')
      .groupBy('post.status')
      .getRawMany();
  }
}
