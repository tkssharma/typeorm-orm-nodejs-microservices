import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Author } from '../entities/Author';

export class AuthorService {
  private authorRepository: Repository<Author>;

  constructor() {
    this.authorRepository = AppDataSource.getRepository(Author);
  }

  async findAll(): Promise<Author[]> {
    return this.authorRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Author | null> {
    return this.authorRepository.findOne({
      where: { id },
      relations: ['posts'],
    });
  }

  async findByEmail(email: string): Promise<Author | null> {
    return this.authorRepository.findOneBy({ email });
  }

  async create(data: Partial<Author>): Promise<Author> {
    const author = this.authorRepository.create(data);
    return this.authorRepository.save(author);
  }

  async update(id: number, data: Partial<Author>): Promise<Author | null> {
    const author = await this.findById(id);
    if (!author) return null;

    Object.assign(author, data);
    return this.authorRepository.save(author);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.authorRepository.delete(id);
    return result.affected !== 0;
  }

  async deactivate(id: number): Promise<Author | null> {
    return this.update(id, { isActive: false });
  }

  async getAuthorWithPostCount(): Promise<any[]> {
    return this.authorRepository
      .createQueryBuilder('author')
      .leftJoin('author.posts', 'post')
      .select('author.id', 'id')
      .addSelect('author.firstName', 'firstName')
      .addSelect('author.lastName', 'lastName')
      .addSelect('author.email', 'email')
      .addSelect('COUNT(post.id)', 'postCount')
      .where('author.isActive = :isActive', { isActive: true })
      .groupBy('author.id')
      .orderBy('postCount', 'DESC')
      .getRawMany();
  }
}
