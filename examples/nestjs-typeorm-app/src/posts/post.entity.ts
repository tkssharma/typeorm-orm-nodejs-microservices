import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Comment } from '../comments/comment.entity';
import { Review } from '../reviews/review.entity';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 300, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  excerpt!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status!: PostStatus;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column()
  authorId!: number;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];

  @OneToMany(() => Review, (review) => review.post)
  reviews!: Review[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
