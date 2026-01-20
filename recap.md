# 📋 TypeORM Cheatsheet

> Quick reference for TypeORM with TypeScript

---

## 🔧 Installation

```bash
# Core packages
npm install typeorm reflect-metadata pg

# TypeScript support
npm install -D typescript ts-node @types/node

# For Express integration
npm install express
npm install -D @types/express
```

---

## ⚙️ DataSource Configuration

```typescript
// src/data-source.ts
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mydb',
  synchronize: false, // Use migrations in production!
  logging: process.env.NODE_ENV === 'development',
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
});
```

---

## 📦 Entity Basics

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date; // For soft deletes
}
```

---

## 🔗 Relationships

### One-to-One

```typescript
// Profile belongs to User
@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bio: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User;
}

// User has one Profile
@Entity()
export class User {
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;
}
```

### One-to-Many / Many-to-One

```typescript
// User has many Posts
@Entity()
export class User {
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}

// Post belongs to User
@Entity()
export class Post {
  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'author_id' })
  author: User;
}
```

### Many-to-Many

```typescript
// With join table
@Entity()
export class Post {
  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'post_id' },
    inverseJoinColumn: { name: 'tag_id' },
  })
  tags: Tag[];
}

@Entity()
export class Tag {
  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}
```

---

## 🔍 Repository Methods

```typescript
const userRepo = AppDataSource.getRepository(User);

// Find all
const users = await userRepo.find();

// Find with conditions
const activeUsers = await userRepo.find({
  where: { isActive: true },
  order: { createdAt: 'DESC' },
  take: 10,
  skip: 0,
});

// Find one
const user = await userRepo.findOne({ where: { id: 1 } });
const userOrFail = await userRepo.findOneOrFail({ where: { id: 1 } });

// Find with relations
const userWithPosts = await userRepo.find({
  relations: ['posts', 'profile'],
});

// Find by IDs
const users = await userRepo.findByIds([1, 2, 3]);

// Count
const count = await userRepo.count({ where: { isActive: true } });

// Create and save
const newUser = userRepo.create({ name: 'John', email: 'john@example.com' });
await userRepo.save(newUser);

// Update
await userRepo.update({ id: 1 }, { name: 'Jane' });

// Delete
await userRepo.delete({ id: 1 });

// Soft delete
await userRepo.softDelete({ id: 1 });

// Restore soft deleted
await userRepo.restore({ id: 1 });
```

---

## 🏗️ QueryBuilder

```typescript
const userRepo = AppDataSource.getRepository(User);

// SELECT
const users = await userRepo
  .createQueryBuilder('user')
  .where('user.isActive = :isActive', { isActive: true })
  .andWhere('user.age > :age', { age: 18 })
  .orderBy('user.createdAt', 'DESC')
  .take(10)
  .skip(0)
  .getMany();

// With joins
const usersWithPosts = await userRepo
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post')
  .where('post.isPublished = :published', { published: true })
  .getMany();

// INSERT
await AppDataSource.createQueryBuilder()
  .insert()
  .into(User)
  .values([
    { name: 'John', email: 'john@example.com' },
    { name: 'Jane', email: 'jane@example.com' },
  ])
  .execute();

// UPDATE
await AppDataSource.createQueryBuilder()
  .update(User)
  .set({ isActive: false })
  .where('lastLoginAt < :date', { date: new Date('2024-01-01') })
  .execute();

// DELETE
await AppDataSource.createQueryBuilder()
  .delete()
  .from(User)
  .where('isActive = :isActive', { isActive: false })
  .execute();

// Subquery
const qb = userRepo.createQueryBuilder('user');
const users = await qb
  .where(
    'user.id IN ' +
      qb.subQuery().select('post.authorId').from(Post, 'post').where('post.views > :views', { views: 1000 }).getQuery(),
  )
  .getMany();
```

---

## 💾 Transactions

```typescript
// Using queryRunner
const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await queryRunner.manager.save(user);
  await queryRunner.manager.save(profile);
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}

// Using transaction method
await AppDataSource.transaction(async (manager) => {
  await manager.save(user);
  await manager.save(profile);
});

// With isolation level
await AppDataSource.transaction('SERIALIZABLE', async (manager) => {
  await manager.save(user);
});
```

---

## 🔄 Migrations

```bash
# Generate migration from entity changes
npx typeorm migration:generate src/migrations/CreateUsers -d src/data-source.ts

# Create empty migration
npx typeorm migration:create src/migrations/AddUserIndex

# Run migrations
npx typeorm migration:run -d src/data-source.ts

# Revert last migration
npx typeorm migration:revert -d src/data-source.ts

# Show migrations
npx typeorm migration:show -d src/data-source.ts
```

### Migration Template

```typescript
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsers1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

---

## 🎣 Entity Subscribers

```typescript
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log('Before insert:', event.entity);
  }

  afterInsert(event: InsertEvent<User>) {
    console.log('After insert:', event.entity);
  }

  beforeUpdate(event: UpdateEvent<User>) {
    console.log('Before update:', event.entity);
  }

  afterUpdate(event: UpdateEvent<User>) {
    console.log('After update:', event.entity);
  }
}
```

---

## 📊 Column Types Reference

| TypeORM Type         | PostgreSQL Type          |
| -------------------- | ------------------------ |
| `"varchar"`          | VARCHAR                  |
| `"text"`             | TEXT                     |
| `"int"`              | INTEGER                  |
| `"bigint"`           | BIGINT                   |
| `"float"`            | REAL                     |
| `"double precision"` | DOUBLE PRECISION         |
| `"decimal"`          | DECIMAL                  |
| `"boolean"`          | BOOLEAN                  |
| `"date"`             | DATE                     |
| `"timestamp"`        | TIMESTAMP                |
| `"timestamptz"`      | TIMESTAMP WITH TIME ZONE |
| `"json"`             | JSON                     |
| `"jsonb"`            | JSONB                    |
| `"uuid"`             | UUID                     |
| `"bytea"`            | BYTEA                    |
| `"enum"`             | ENUM                     |

---

## 🔒 Soft Delete Queries

```typescript
// Find including soft deleted
const allUsers = await userRepo.find({ withDeleted: true });

// Find only soft deleted
const deletedUsers = await userRepo
  .createQueryBuilder('user')
  .withDeleted()
  .where('user.deletedAt IS NOT NULL')
  .getMany();

// Restore
await userRepo.restore({ id: 1 });
```

---

## 📈 Indexes

```typescript
@Entity()
@Index(['firstName', 'lastName']) // Composite index
@Index(['email'], { unique: true }) // Unique index
export class User {
  @Index() // Single column index
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;
}
```

---

## 🔧 Common Options

### Find Options

```typescript
{
  where: { isActive: true },
  relations: ["posts", "profile"],
  select: ["id", "name", "email"],
  order: { createdAt: "DESC" },
  take: 10,
  skip: 0,
  cache: true,
  withDeleted: false,
  loadRelationIds: true,
}
```

### Column Options

```typescript
@Column({
  type: "varchar",
  length: 100,
  nullable: false,
  unique: true,
  default: "default value",
  select: false, // Exclude from SELECT by default
  name: "column_name", // Custom column name
  comment: "Column description",
})
```

---

## ⚠️ Common Mistakes

1. **Using `synchronize: true` in production** - Always use migrations!
2. **Not handling connection errors** - Wrap initialization in try-catch
3. **N+1 queries** - Use `relations` or `leftJoinAndSelect`
4. **Not closing connections** - Call `destroy()` on shutdown
5. **Forgetting `reflect-metadata`** - Import at entry point
6. **Not validating input** - Use class-validator with DTOs

---

## 🚀 Quick Tips

```typescript
// Import reflect-metadata at app entry
import 'reflect-metadata';

// Initialize DataSource
await AppDataSource.initialize();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await AppDataSource.destroy();
  process.exit(0);
});
```

---

**Happy Coding! 🎉**
