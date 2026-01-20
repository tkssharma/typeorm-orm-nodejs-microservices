import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity("posts")
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 200 })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "int", default: 0 })
  views: number;

  @Column({ type: "boolean", default: false })
  isPublished: boolean;

  @Column()
  authorId: number;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: "authorId" })
  author: User;

  @CreateDateColumn()
  createdAt: Date;
}
