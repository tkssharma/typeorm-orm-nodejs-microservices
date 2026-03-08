import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { User } from 'src/users/user.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Review[]> {
    return this.reviewRepository.find({
      relations: ['user', 'post'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'post'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async findByPost(postId: number): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { userId },
      relations: ['post'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const existingReview = await this.reviewRepository.findOne({
      where: { userId: createReviewDto.userId, postId: createReviewDto.postId },
    });

    if (existingReview) {
      throw new ConflictException('User has already reviewed this post');
    }

    const review = this.reviewRepository.create(createReviewDto);
    return this.reviewRepository.save(review);
  }

  async update(id: number, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const review = await this.findOne(id);
    Object.assign(review, updateReviewDto);
    return this.reviewRepository.save(review);
  }

  async remove(id: number): Promise<void> {
    const review = await this.findOne(id);
    await this.reviewRepository.remove(review);
  }

  async getAverageRating(postId: number): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.postId = :postId', { postId })
      .getRawOne();

    return result?.avg ? parseFloat(result.avg) : 0;
  }
}
