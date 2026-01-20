# Section 09: Soft Deletes and Paranoid Tables

## 📚 Learning Objectives

By the end of this section, you will:

- Understand soft delete pattern
- Implement soft deletes in TypeORM
- Query soft-deleted records
- Restore deleted records
- Handle soft deletes in relationships

---

## 📖 Lessons

### Lesson 9.1: What is Soft Delete?

**Soft delete** marks records as deleted without actually removing them from the database. This is also called "paranoid" tables.

```
┌─────────────────────────────────────────────────────────────┐
│                    Hard Delete vs Soft Delete                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Hard Delete:  DELETE FROM users WHERE id = 1               │
│  → Record is permanently removed                             │
│                                                              │
│  Soft Delete:  UPDATE users SET deletedAt = NOW()           │
│                WHERE id = 1                                  │
│  → Record remains, marked as deleted                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Benefits of Soft Delete

- ✅ Data recovery possible
- ✅ Audit trail preserved
- ✅ Referential integrity maintained
- ✅ Undo functionality
- ✅ Legal/compliance requirements

#### Drawbacks

- ⚠️ Database grows larger
- ⚠️ Queries need to filter deleted records
- ⚠️ Unique constraints become complex

---

### Lesson 9.2: Implementing Soft Delete

#### Add DeleteDateColumn

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  firstName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null; // null = not deleted
}
```

The `@DeleteDateColumn()` decorator:

- Creates a nullable timestamp column
- `null` means the record is active
- A date value means the record is soft-deleted
- TypeORM automatically filters out soft-deleted records

---

### Lesson 9.3: Soft Delete Operations

#### Using Repository Methods

```typescript
const userRepository = AppDataSource.getRepository(User);

// Soft delete by ID
await userRepository.softDelete(1);

// Soft delete by criteria
await userRepository.softDelete({ email: 'john@example.com' });

// Soft delete entity instance
const user = await userRepository.findOneBy({ id: 1 });
await userRepository.softRemove(user);

// Soft delete multiple
const users = await userRepository.findBy({ isActive: false });
await userRepository.softRemove(users);
```

#### Using QueryBuilder

```typescript
// Soft delete with QueryBuilder
await userRepository.createQueryBuilder().softDelete().where('id = :id', { id: 1 }).execute();

// Soft delete with condition
await userRepository
  .createQueryBuilder()
  .softDelete()
  .where('lastLoginAt < :date', { date: new Date('2023-01-01') })
  .execute();
```

---

### Lesson 9.4: Querying Soft-Deleted Records

By default, soft-deleted records are **excluded** from queries.

#### Default Behavior (Excludes Deleted)

```typescript
// Only returns non-deleted users
const users = await userRepository.find();

// Also excludes deleted
const user = await userRepository.findOneBy({ id: 1 });
// Returns null if user is soft-deleted
```

#### Include Soft-Deleted Records

```typescript
// Include deleted records
const allUsers = await userRepository.find({
  withDeleted: true,
});

// Find specific record even if deleted
const user = await userRepository.findOne({
  where: { id: 1 },
  withDeleted: true,
});
```

#### Query Only Deleted Records

```typescript
// Using QueryBuilder
const deletedUsers = await userRepository
  .createQueryBuilder('user')
  .withDeleted()
  .where('user.deletedAt IS NOT NULL')
  .getMany();

// Alternative
const deletedUsers = await userRepository
  .createQueryBuilder('user')
  .withDeleted()
  .andWhere('user.deletedAt IS NOT NULL')
  .getMany();
```

---

### Lesson 9.5: Restoring Soft-Deleted Records

#### Using Repository

```typescript
// Restore by ID
await userRepository.restore(1);

// Restore by criteria
await userRepository.restore({ email: 'john@example.com' });
```

#### Using QueryBuilder

```typescript
// Restore with QueryBuilder
await userRepository.createQueryBuilder().restore().where('id = :id', { id: 1 }).execute();

// Restore multiple
await userRepository
  .createQueryBuilder()
  .restore()
  .where('deletedAt > :date', { date: new Date('2024-01-01') })
  .execute();
```

---

### Lesson 9.6: Soft Delete with Relationships

#### Cascade Soft Delete

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Post, (post) => post.author, {
    cascade: ['soft-remove'], // Cascade soft delete
  })
  posts: Post[];

  @DeleteDateColumn()
  deletedAt: Date | null;
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
```

```typescript
// Soft delete user and all their posts
const user = await userRepository.findOne({
  where: { id: 1 },
  relations: ['posts'],
});
await userRepository.softRemove(user);
// User and all posts are soft-deleted
```

#### Cascade Restore

```typescript
@OneToMany(() => Post, (post) => post.author, {
  cascade: ["soft-remove", "recover"],  // Also cascade restore
})
posts: Post[];
```

```typescript
// Restore user and all their posts
const user = await userRepository.findOne({
  where: { id: 1 },
  withDeleted: true,
  relations: ['posts'],
});
await userRepository.recover(user);
```

---

### Lesson 9.7: Handling Unique Constraints

Soft delete can cause issues with unique constraints.

#### Problem

```typescript
// User with email "john@example.com" is soft-deleted
// Trying to create new user with same email fails!
// Because the soft-deleted record still exists
```

#### Solution 1: Partial Unique Index

```sql
-- PostgreSQL partial index
CREATE UNIQUE INDEX "UQ_users_email_active"
ON "users" ("email")
WHERE "deletedAt" IS NULL;
```

```typescript
// In migration
await queryRunner.query(`
  CREATE UNIQUE INDEX "UQ_users_email_active" 
  ON "users" ("email") 
  WHERE "deletedAt" IS NULL
`);
```

#### Solution 2: Include deletedAt in Unique

```typescript
@Entity('users')
@Index(['email', 'deletedAt'], { unique: true })
export class User {
  @Column()
  email: string;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
```

#### Solution 3: Modify Email on Delete

```typescript
async softDeleteUser(id: number) {
  const user = await userRepository.findOneBy({ id });
  if (user) {
    // Append timestamp to email to free up the original
    user.email = `${user.email}_deleted_${Date.now()}`;
    await userRepository.save(user);
    await userRepository.softDelete(id);
  }
}
```

---

### Lesson 9.8: Service Layer Implementation

```typescript
// src/services/userService.ts
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

const userRepository = AppDataSource.getRepository(User);

export class UserService {
  // Get all active users
  async findAll() {
    return userRepository.find();
  }

  // Get all users including deleted
  async findAllWithDeleted() {
    return userRepository.find({ withDeleted: true });
  }

  // Get only deleted users
  async findDeleted() {
    return userRepository.createQueryBuilder('user').withDeleted().where('user.deletedAt IS NOT NULL').getMany();
  }

  // Find by ID (active only)
  async findById(id: number) {
    return userRepository.findOneBy({ id });
  }

  // Find by ID (including deleted)
  async findByIdWithDeleted(id: number) {
    return userRepository.findOne({
      where: { id },
      withDeleted: true,
    });
  }

  // Soft delete
  async softDelete(id: number) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    await userRepository.softDelete(id);
  }

  // Restore
  async restore(id: number) {
    const user = await this.findByIdWithDeleted(id);
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.deletedAt) {
      throw new Error('User is not deleted');
    }
    await userRepository.restore(id);
  }

  // Permanent delete
  async permanentDelete(id: number) {
    const user = await this.findByIdWithDeleted(id);
    if (!user) {
      throw new Error('User not found');
    }
    await userRepository.delete(id); // Hard delete
  }
}
```

---

### Lesson 9.9: API Endpoints for Soft Delete

```typescript
// src/routes/userRoutes.ts
import { Router } from 'express';
import { userService } from '../services/userService';

const router = Router();

// GET /users - Active users only
router.get('/', async (req, res) => {
  const users = await userService.findAll();
  res.json(users);
});

// GET /users/deleted - Deleted users only
router.get('/deleted', async (req, res) => {
  const users = await userService.findDeleted();
  res.json(users);
});

// GET /users/all - All users including deleted
router.get('/all', async (req, res) => {
  const users = await userService.findAllWithDeleted();
  res.json(users);
});

// DELETE /users/:id - Soft delete
router.delete('/:id', async (req, res) => {
  await userService.softDelete(parseInt(req.params.id));
  res.status(204).send();
});

// POST /users/:id/restore - Restore deleted user
router.post('/:id/restore', async (req, res) => {
  await userService.restore(parseInt(req.params.id));
  res.json({ message: 'User restored' });
});

// DELETE /users/:id/permanent - Permanent delete
router.delete('/:id/permanent', async (req, res) => {
  await userService.permanentDelete(parseInt(req.params.id));
  res.status(204).send();
});

export { router as userRoutes };
```

---

## 🎯 Key Takeaways

1. Use **@DeleteDateColumn()** to enable soft deletes
2. Soft-deleted records are **automatically excluded** from queries
3. Use **withDeleted: true** to include deleted records
4. Use **restore()** to recover soft-deleted records
5. Handle **unique constraints** carefully with soft delete
6. Consider **cascade soft-remove** for related entities

---

## ✅ Quiz

1. What column type enables soft delete in TypeORM?
2. How do you include soft-deleted records in a query?
3. How do you restore a soft-deleted record?
4. What problem can soft delete cause with unique constraints?
5. How do you query only deleted records?

<details>
<summary>View Answers</summary>

1. `@DeleteDateColumn()`
2. Use `withDeleted: true` in find options
3. Use `repository.restore(id)` or QueryBuilder `.restore()`
4. Deleted records still occupy unique values, blocking new records
5. Use QueryBuilder with `.withDeleted().where("deletedAt IS NOT NULL")`

</details>

---

## 📝 Homework

1. Add soft delete to your User entity
2. Create API endpoints for soft delete, restore, and permanent delete
3. Implement cascade soft delete for User → Posts
4. Handle unique email constraint with soft delete

---

## ➡️ Next Section

[Section 10: Database Seeding](../section-10-seeding/README.md)
