import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Post } from '../posts/post.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  authorName!: string;

  @Column({ type: 'varchar', length: 255 })
  authorEmail!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'boolean', default: false })
  isApproved!: boolean;

  @Column()
  postId!: number;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  post!: Post;

  @Column({ type: 'int', nullable: true })
  parentId!: number | null;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent!: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies!: Comment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
