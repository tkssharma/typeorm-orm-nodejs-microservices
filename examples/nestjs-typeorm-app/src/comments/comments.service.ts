import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) { }

  async findByPost(postId: number, approvedOnly = true): Promise<Comment[]> {
    const where: any = { postId, parentId: IsNull() };
    if (approvedOnly) {
      where.isApproved = true;
    }

    return this.commentRepository.find({
      where,
      relations: ['replies'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['replies', 'post'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    const comment = this.commentRepository.create(createCommentDto);
    return this.commentRepository.save(comment);
  }

  async approve(id: number): Promise<Comment> {
    const comment = await this.findOne(id);
    comment.isApproved = true;
    return this.commentRepository.save(comment);
  }

  async remove(id: number): Promise<void> {
    const comment = await this.findOne(id);
    await this.commentRepository.remove(comment);
  }

  async getPendingComments(): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { isApproved: false },
      relations: ['post'],
      order: { createdAt: 'ASC' },
    });
  }
}
