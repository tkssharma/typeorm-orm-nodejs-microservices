import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("transaction_logs")
export class TransactionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fromAccountId: number;

  @Column()
  toAccountId: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: string;

  @Column({ type: "varchar", length: 50 })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
