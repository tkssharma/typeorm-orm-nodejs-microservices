import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  postId!: number;

  @ManyToOne(() => Post, (post) => post.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: Post;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
