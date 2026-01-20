import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity("profiles")
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text", nullable: true })
  bio: string;

  @Column({ type: "varchar", nullable: true })
  avatarUrl: string;

  @Column({ type: "varchar", nullable: true })
  website: string;

  @Column()
  userId: number;

  // One-to-One: Profile belongs to User
  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: "userId" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
