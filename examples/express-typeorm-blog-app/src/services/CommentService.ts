import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Comment } from '../entities/Comment';

export class CommentService {
  private commentRepository: Repository<Comment>;

  constructor() {
    this.commentRepository = AppDataSource.getRepository(Comment);
  }

  async findByPost(postId: number, approvedOnly = true): Promise<Comment[]> {
    const where: any = { postId, parentId: null }; // Only top-level comments
    if (approvedOnly) {
      where.isApproved = true;
    }

    return this.commentRepository.find({
      where,
      relations: ['replies'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Comment | null> {
    return this.commentRepository.findOne({
      where: { id },
      relations: ['replies', 'post'],
    });
  }

  async create(data: Partial<Comment>): Promise<Comment> {
    const comment = this.commentRepository.create(data);
    return this.commentRepository.save(comment);
  }

  async createReply(parentId: number, data: Partial<Comment>): Promise<Comment | null> {
    const parent = await this.findById(parentId);
    if (!parent) return null;

    const reply = this.commentRepository.create({
      ...data,
      postId: parent.postId,
      parentId: parent.id,
    });
    return this.commentRepository.save(reply);
  }

  async approve(id: number): Promise<Comment | null> {
    const comment = await this.findById(id);
    if (!comment) return null;

    comment.isApproved = true;
    return this.commentRepository.save(comment);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.commentRepository.delete(id);
    return result.affected !== 0;
  }

  async getPendingComments(): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { isApproved: false },
      relations: ['post'],
      order: { createdAt: 'ASC' },
    });
  }

  async getCommentCountByPost(postId: number): Promise<number> {
    return this.commentRepository.count({
      where: { postId, isApproved: true },
    });
  }
}
