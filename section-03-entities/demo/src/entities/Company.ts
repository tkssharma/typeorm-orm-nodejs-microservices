import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

// Embeddable class - not an entity, just reusable columns
export class Address {
  @Column({ type: "varchar", length: 255 })
  street: string;

  @Column({ type: "varchar", length: 100 })
  city: string;

  @Column({ type: "varchar", length: 100 })
  state: string;

  @Column({ type: "varchar", length: 20 })
  zipCode: string;

  @Column({ type: "varchar", length: 100 })
  country: string;
}

@Entity("companies")
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  industry: string | null;

  @Column({ type: "int", nullable: true })
  employeeCount: number | null;

  // Embedded address - creates columns like headquartersStreet, headquartersCity, etc.
  @Column(() => Address)
  headquarters: Address;

  // Another embedded address for billing
  @Column(() => Address)
  billingAddress: Address;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
