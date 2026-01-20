# Section 03: Entities, Columns, and Decorators

## 📚 Learning Objectives

By the end of this section, you will:

- Understand what entities are in TypeORM
- Master all column types and options
- Use primary columns and generated values
- Work with special columns (timestamps, soft delete)
- Implement column transformers
- Understand entity inheritance patterns

---

## 📖 Lessons

### Lesson 3.1: What are Entities?

An **Entity** is a class that maps to a database table. Each instance of an entity represents a row in that table.

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users') // Table name: "users"
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;
}
```

This creates a table:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL
);
```

#### Entity Decorator Options

```typescript
@Entity({
  name: 'users', // Custom table name
  schema: 'public', // Database schema
  engine: 'InnoDB', // MySQL engine
  database: 'secondary', // For multiple databases
  orderBy: {
    // Default ordering
    createdAt: 'DESC',
  },
  synchronize: true, // Include in schema sync
})
export class User {}
```

---

### Lesson 3.2: Column Types

TypeORM supports many column types. Here are the most common ones for PostgreSQL:

#### Basic Column Types

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  // String types
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'char', length: 2 })
  countryCode: string;

  // Numeric types
  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'bigint' })
  viewCount: string; // bigint returns string in JS

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: string; // decimal returns string for precision

  @Column({ type: 'float' })
  rating: number;

  // Boolean
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Date/Time
  @Column({ type: 'date' })
  releaseDate: Date;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamptz' }) // With timezone
  updatedAt: Date;

  @Column({ type: 'time' })
  openingTime: string;

  // JSON
  @Column({ type: 'json' })
  metadata: object;

  @Column({ type: 'jsonb' }) // Binary JSON (faster queries)
  settings: object;

  // UUID
  @Column({ type: 'uuid' })
  externalId: string;

  // Arrays (PostgreSQL specific)
  @Column({ type: 'text', array: true })
  tags: string[];

  @Column({ type: 'int', array: true })
  scores: number[];
}
```

#### PostgreSQL Column Types Reference

| TypeORM Type          | PostgreSQL Type          | JavaScript Type |
| --------------------- | ------------------------ | --------------- |
| `varchar`             | VARCHAR                  | string          |
| `text`                | TEXT                     | string          |
| `int` / `integer`     | INTEGER                  | number          |
| `bigint`              | BIGINT                   | string          |
| `decimal` / `numeric` | DECIMAL                  | string          |
| `float` / `real`      | REAL                     | number          |
| `double precision`    | DOUBLE PRECISION         | number          |
| `boolean`             | BOOLEAN                  | boolean         |
| `date`                | DATE                     | Date            |
| `timestamp`           | TIMESTAMP                | Date            |
| `timestamptz`         | TIMESTAMP WITH TIME ZONE | Date            |
| `time`                | TIME                     | string          |
| `json`                | JSON                     | object          |
| `jsonb`               | JSONB                    | object          |
| `uuid`                | UUID                     | string          |
| `bytea`               | BYTEA                    | Buffer          |
| `enum`                | ENUM                     | string          |

---

### Lesson 3.3: Column Options

Every column can have various options:

```typescript
@Column({
  // Type configuration
  type: "varchar",
  length: 100,

  // Constraints
  nullable: false,        // NOT NULL (default: false)
  unique: true,           // UNIQUE constraint
  default: "default",     // Default value

  // Column naming
  name: "first_name",     // Custom column name in DB

  // Selection behavior
  select: false,          // Exclude from SELECT by default

  // Insert/Update behavior
  insert: true,           // Include in INSERT
  update: true,           // Include in UPDATE

  // Documentation
  comment: "User's first name",

  // For numeric types
  precision: 10,          // Total digits
  scale: 2,               // Decimal places

  // For enums
  enum: ["admin", "user", "guest"],
  enumName: "user_role",

  // Collation
  collation: "en_US.UTF-8",

  // Character set (MySQL)
  charset: "utf8mb4",
})
firstName: string;
```

#### Common Patterns

```typescript
// Nullable column
@Column({ nullable: true })
middleName: string | null;

// Column with default value
@Column({ default: 0 })
loginCount: number;

// Unique column
@Column({ unique: true })
email: string;

// Column excluded from SELECT
@Column({ select: false })
password: string;

// Read-only column (can't update)
@Column({ update: false })
createdBy: string;
```

---

### Lesson 3.4: Primary Columns

Every entity needs at least one primary column.

#### Auto-increment Primary Key

```typescript
// Integer auto-increment
@PrimaryGeneratedColumn()
id: number;

// Bigint auto-increment
@PrimaryGeneratedColumn("increment")
id: number;
```

#### UUID Primary Key

```typescript
// UUID v4
@PrimaryGeneratedColumn("uuid")
id: string;
```

#### Custom Primary Key

```typescript
// Manual primary key
@PrimaryColumn()
id: string;

// With type
@PrimaryColumn({ type: "varchar", length: 50 })
code: string;
```

#### Composite Primary Key

```typescript
@Entity()
export class OrderItem {
  @PrimaryColumn()
  orderId: number;

  @PrimaryColumn()
  productId: number;

  @Column()
  quantity: number;
}
```

---

### Lesson 3.5: Special Columns

TypeORM provides decorators for common column patterns.

#### Timestamp Columns

```typescript
import { CreateDateColumn, UpdateDateColumn, DeleteDateColumn, VersionColumn } from 'typeorm';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  // Automatically set on INSERT
  @CreateDateColumn()
  createdAt: Date;

  // Automatically updated on UPDATE
  @UpdateDateColumn()
  updatedAt: Date;

  // For soft deletes (set when deleted)
  @DeleteDateColumn()
  deletedAt: Date;

  // Optimistic locking version
  @VersionColumn()
  version: number;
}
```

#### Generated Columns (PostgreSQL 12+)

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  // Generated column (computed)
  @Column({
    generatedType: 'STORED',
    asExpression: `"firstName" || ' ' || "lastName"`,
  })
  fullName: string;
}
```

---

### Lesson 3.6: Enum Columns

TypeORM supports enum types in multiple ways.

#### Using TypeScript Enum

```typescript
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;
}
```

#### Using String Array

```typescript
@Column({
  type: "enum",
  enum: ["small", "medium", "large"],
  default: "medium",
})
size: string;
```

---

### Lesson 3.7: Column Transformers

Transformers let you modify data when reading from or writing to the database.

```typescript
import { ValueTransformer } from 'typeorm';

// Encrypt/Decrypt transformer
const encryptTransformer: ValueTransformer = {
  to: (value: string) => {
    // Encrypt before saving
    return Buffer.from(value).toString('base64');
  },
  from: (value: string) => {
    // Decrypt when reading
    return Buffer.from(value, 'base64').toString('utf8');
  },
};

// Lowercase transformer
const lowercaseTransformer: ValueTransformer = {
  to: (value: string) => value?.toLowerCase(),
  from: (value: string) => value,
};

// JSON transformer for text columns
const jsonTransformer: ValueTransformer = {
  to: (value: object) => JSON.stringify(value),
  from: (value: string) => JSON.parse(value),
};

// BigInt transformer
const bigintTransformer: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseInt(value, 10),
};

@Entity()
export class User {
  @Column({ transformer: lowercaseTransformer })
  email: string;

  @Column({ transformer: encryptTransformer })
  sensitiveData: string;

  @Column({ type: 'bigint', transformer: bigintTransformer })
  viewCount: number;
}
```

---

### Lesson 3.8: Entity Inheritance

TypeORM supports several inheritance patterns.

#### Single Table Inheritance

All entities share one table with a discriminator column.

```typescript
@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @CreateDateColumn()
  createdAt: Date;
}

@ChildEntity('photo')
export class Photo extends Content {
  @Column()
  url: string;

  @Column()
  size: number;
}

@ChildEntity('video')
export class Video extends Content {
  @Column()
  url: string;

  @Column()
  duration: number;
}
```

#### Class Table Inheritance (Concrete Table)

Each entity has its own table.

```typescript
// Base class (not an entity)
export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity()
export class User extends BaseEntity {
  @Column()
  email: string;
}

@Entity()
export class Product extends BaseEntity {
  @Column()
  name: string;
}
```

#### Embedded Entities

Reusable column groups without separate tables.

```typescript
// Embeddable class (not an entity)
export class Address {
  @Column()
  street: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  zipCode: string;

  @Column()
  country: string;
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column(() => Address)
  homeAddress: Address;

  @Column(() => Address)
  workAddress: Address;
}
```

This creates columns: `homeAddressStreet`, `homeAddressCity`, `workAddressStreet`, etc.

---

### Lesson 3.9: Complete Entity Example

Here's a production-ready entity with all common patterns:

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  Check,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['firstName', 'lastName'])
@Check(`"age" >= 0 AND "age" <= 150`)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'int', default: 0 })
  loginCount: number;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
```

---

## 🎯 Key Takeaways

1. **Entities** map classes to database tables
2. Use **@Column** with type options for precise control
3. **@PrimaryGeneratedColumn** handles auto-increment and UUID
4. **Special columns** automate timestamps and versioning
5. **Transformers** modify data during read/write
6. **Inheritance** patterns help organize related entities
7. **Embedded entities** create reusable column groups

---

## ✅ Quiz

1. What decorator marks a class as a database table?
2. How do you create a UUID primary key?
3. What's the difference between `@CreateDateColumn` and `@UpdateDateColumn`?
4. How do you exclude a column from SELECT queries by default?
5. What is a column transformer used for?
6. How do you create a composite primary key?

<details>
<summary>View Answers</summary>

1. `@Entity()`
2. `@PrimaryGeneratedColumn("uuid")`
3. `@CreateDateColumn` is set once on insert; `@UpdateDateColumn` is updated on every save
4. Use `select: false` option: `@Column({ select: false })`
5. To modify data when reading from or writing to the database
6. Use multiple `@PrimaryColumn()` decorators on different properties

</details>

---

## 📝 Homework

1. Create a `Product` entity with: id, name, description, price, quantity, category (enum), isAvailable, createdAt, updatedAt
2. Create an `Address` embeddable and use it in a `Company` entity
3. Implement a transformer that encrypts/decrypts a column value
4. Create an entity with a composite primary key

---

## 📚 Further Reading

- [TypeORM Entity Documentation](https://typeorm.io/entities)
- [TypeORM Column Types](https://typeorm.io/entities#column-types)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)

---

## ➡️ Next Section

[Section 04: Repositories and Data Access Layer](../section-04-repositories/README.md)
