import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Post } from '../posts/post.entity';
import { Review } from '../reviews/review.entity';
import { Role } from './enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role!: Role;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Post, (post) => post.author)
  posts!: Post[];

  @OneToMany(() => Review, (review) => review.user)
  reviews!: Review[];
}
