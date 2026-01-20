import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum ProductCategory {
  ELECTRONICS = "electronics",
  CLOTHING = "clothing",
  BOOKS = "books",
  FOOD = "food",
  OTHER = "other",
}

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: string;

  @Column({ type: "int", default: 0 })
  quantity: number;

  @Column({
    type: "enum",
    enum: ProductCategory,
    default: ProductCategory.OTHER,
  })
  category: ProductCategory;

  @Column({ type: "boolean", default: true })
  isAvailable: boolean;

  @Column({ type: "text", array: true, nullable: true })
  tags: string[] | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
