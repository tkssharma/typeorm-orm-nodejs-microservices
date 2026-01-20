import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from "typeorm";
import { Profile } from "./Profile";
import { Post } from "./Post";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100 })
  firstName: string;

  @Column({ type: "varchar", length: 100 })
  lastName: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  // One-to-One: User has one Profile
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  // One-to-Many: User has many Posts
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
