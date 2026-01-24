import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { Author } from './Author';
import { Comment } from './Comment';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('posts')
@Index('IDX_post_author', ['authorId'])
@Index('IDX_post_status', ['status'])
@Index('IDX_post_published_at', ['publishedAt'])
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Index('IDX_post_slug', { unique: true })
  @Column({ type: 'varchar', length: 300, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column()
  authorId: number;

  // Many posts belong to one author
  @ManyToOne(() => Author, (author) => author.posts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'authorId' })
  author: Author;

  // One post can have many comments
  @OneToMany(() => Comment, (comment) => comment.post, {
    cascade: ['insert', 'update'],
  })
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Soft delete support
  @DeleteDateColumn()
  deletedAt: Date | null;
}
