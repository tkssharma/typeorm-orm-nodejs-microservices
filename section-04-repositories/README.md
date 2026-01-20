# Section 04: Repositories and Data Access Layer

## 📚 Learning Objectives

By the end of this section, you will:

- Understand the Repository pattern in TypeORM
- Master all repository methods
- Create custom repositories
- Implement a clean data access layer
- Know when to use Repository vs DataSource APIs

---

## 📖 Lessons

### Lesson 4.1: Understanding Repositories

A **Repository** is a class that encapsulates all database operations for a specific entity. It provides methods to find, insert, update, and delete records.

```typescript
import { AppDataSource } from './data-source';
import { User } from './entities/User';

// Get repository for User entity
const userRepository = AppDataSource.getRepository(User);

// Now you can use repository methods
const users = await userRepository.find();
```

#### Why Use Repositories?

| Benefit                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| **Separation of Concerns** | Database logic is isolated from business logic |
| **Testability**            | Easy to mock for unit tests                    |
| **Reusability**            | Common queries in one place                    |
| **Type Safety**            | Full TypeScript support                        |

---

### Lesson 4.2: Repository Methods - Finding Data

#### find() - Get Multiple Records

```typescript
// Find all users
const allUsers = await userRepository.find();

// Find with conditions
const activeUsers = await userRepository.find({
  where: { isActive: true },
});

// Find with multiple conditions (AND)
const adminUsers = await userRepository.find({
  where: {
    role: 'admin',
    isActive: true,
  },
});

// Find with OR conditions
const users = await userRepository.find({
  where: [{ role: 'admin' }, { role: 'moderator' }],
});

// Find with ordering
const sortedUsers = await userRepository.find({
  order: {
    createdAt: 'DESC',
    lastName: 'ASC',
  },
});

// Find with pagination
const paginatedUsers = await userRepository.find({
  skip: 0, // offset
  take: 10, // limit
});

// Find with selected columns
const userNames = await userRepository.find({
  select: ['id', 'firstName', 'lastName'],
});

// Find with relations
const usersWithPosts = await userRepository.find({
  relations: ['posts', 'profile'],
});

// Combined options
const result = await userRepository.find({
  where: { isActive: true },
  relations: ['posts'],
  select: ['id', 'firstName', 'email'],
  order: { createdAt: 'DESC' },
  skip: 0,
  take: 20,
});
```

#### findOne() - Get Single Record

```typescript
// Find by ID
const user = await userRepository.findOne({
  where: { id: 1 },
});

// Find with multiple conditions
const user = await userRepository.findOne({
  where: {
    email: 'john@example.com',
    isActive: true,
  },
});

// Find with relations
const userWithProfile = await userRepository.findOne({
  where: { id: 1 },
  relations: ['profile'],
});

// Returns null if not found
if (user === null) {
  console.log('User not found');
}
```

#### findOneBy() - Simplified Find

```typescript
// Shorthand for simple conditions
const user = await userRepository.findOneBy({ id: 1 });
const user = await userRepository.findOneBy({ email: 'john@example.com' });
```

#### findOneOrFail() - Throw if Not Found

```typescript
try {
  const user = await userRepository.findOneOrFail({
    where: { id: 999 },
  });
} catch (error) {
  // EntityNotFoundError is thrown
  console.log('User not found!');
}
```

#### findAndCount() - With Total Count

```typescript
// Great for pagination
const [users, total] = await userRepository.findAndCount({
  where: { isActive: true },
  skip: 0,
  take: 10,
});

console.log(`Showing ${users.length} of ${total} users`);
```

#### count() - Count Records

```typescript
const totalUsers = await userRepository.count();

const activeCount = await userRepository.count({
  where: { isActive: true },
});
```

#### exists() - Check Existence

```typescript
const emailExists = await userRepository.exists({
  where: { email: 'john@example.com' },
});

if (emailExists) {
  throw new Error('Email already registered');
}
```

---

### Lesson 4.3: Repository Methods - Creating Data

#### create() - Create Entity Instance

```typescript
// create() only creates an instance, doesn't save to DB
const user = userRepository.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
});

// user.id is undefined at this point
console.log(user); // User { firstName: 'John', ... }

// Now save to database
await userRepository.save(user);
// user.id is now set
```

#### save() - Insert or Update

```typescript
// Insert new record
const newUser = userRepository.create({
  firstName: 'Jane',
  email: 'jane@example.com',
});
await userRepository.save(newUser);

// Update existing record
newUser.firstName = 'Janet';
await userRepository.save(newUser); // Updates because id exists

// Save multiple entities
const users = userRepository.create([
  { firstName: 'User1', email: 'user1@example.com' },
  { firstName: 'User2', email: 'user2@example.com' },
]);
await userRepository.save(users);
```

#### insert() - Insert Only (No Update)

```typescript
// Insert without returning entity
const result = await userRepository.insert({
  firstName: 'John',
  email: 'john@example.com',
});

console.log(result.identifiers); // [{ id: 1 }]
console.log(result.generatedMaps); // [{ id: 1, createdAt: ... }]

// Insert multiple
await userRepository.insert([
  { firstName: 'User1', email: 'user1@example.com' },
  { firstName: 'User2', email: 'user2@example.com' },
]);
```

---

### Lesson 4.4: Repository Methods - Updating Data

#### save() - Update with Entity

```typescript
// Load, modify, save
const user = await userRepository.findOneBy({ id: 1 });
if (user) {
  user.firstName = 'Updated Name';
  await userRepository.save(user);
}
```

#### update() - Update Without Loading

```typescript
// Update by criteria (doesn't load entity)
await userRepository.update(
  { id: 1 }, // criteria
  { firstName: 'New Name' }, // partial entity
);

// Update multiple records
await userRepository.update({ isActive: false }, { deletedAt: new Date() });

// Update by ID shorthand
await userRepository.update(1, { firstName: 'New Name' });
```

#### Difference: save() vs update()

| Feature              | save()          | update()     |
| -------------------- | --------------- | ------------ |
| Loads entity         | Yes (if exists) | No           |
| Triggers subscribers | Yes             | No           |
| Returns entity       | Yes             | UpdateResult |
| Cascades             | Yes             | No           |
| Performance          | Slower          | Faster       |

---

### Lesson 4.5: Repository Methods - Deleting Data

#### remove() - Delete Entity

```typescript
// Load and remove
const user = await userRepository.findOneBy({ id: 1 });
if (user) {
  await userRepository.remove(user);
}

// Remove multiple
const users = await userRepository.findBy({ isActive: false });
await userRepository.remove(users);
```

#### delete() - Delete by Criteria

```typescript
// Delete by criteria (doesn't load entity)
await userRepository.delete({ id: 1 });

// Delete by ID
await userRepository.delete(1);

// Delete multiple by IDs
await userRepository.delete([1, 2, 3]);

// Delete by condition
await userRepository.delete({ isActive: false });
```

#### softRemove() - Soft Delete

```typescript
// Requires @DeleteDateColumn in entity
const user = await userRepository.findOneBy({ id: 1 });
if (user) {
  await userRepository.softRemove(user);
  // Sets deletedAt to current timestamp
}
```

#### softDelete() - Soft Delete by Criteria

```typescript
await userRepository.softDelete({ id: 1 });
await userRepository.softDelete({ isActive: false });
```

#### restore() - Restore Soft Deleted

```typescript
await userRepository.restore({ id: 1 });
```

---

### Lesson 4.6: Advanced Find Options

#### Using Operators

```typescript
import {
  Equal,
  Not,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Like,
  ILike,
  Between,
  In,
  IsNull,
  ArrayContains,
  ArrayContainedBy,
  Raw,
} from 'typeorm';

// Equal (default)
await userRepository.find({ where: { age: Equal(25) } });

// Not equal
await userRepository.find({ where: { role: Not('admin') } });

// Comparison operators
await userRepository.find({ where: { age: MoreThan(18) } });
await userRepository.find({ where: { age: LessThanOrEqual(65) } });
await userRepository.find({ where: { age: Between(18, 65) } });

// Pattern matching
await userRepository.find({ where: { email: Like('%@gmail.com') } });
await userRepository.find({ where: { name: ILike('%john%') } }); // Case insensitive

// In array
await userRepository.find({ where: { role: In(['admin', 'moderator']) } });

// Null check
await userRepository.find({ where: { deletedAt: IsNull() } });

// Array operators (PostgreSQL)
await userRepository.find({ where: { tags: ArrayContains(['typescript']) } });

// Raw SQL
await userRepository.find({
  where: {
    createdAt: Raw((alias) => `${alias} > NOW() - INTERVAL '7 days'`),
  },
});
```

#### Relation Filtering

```typescript
// Filter by relation properties
const usersWithPublishedPosts = await userRepository.find({
  relations: ['posts'],
  where: {
    posts: {
      isPublished: true,
    },
  },
});
```

---

### Lesson 4.7: Custom Repositories

Create reusable query methods by extending the repository.

#### Method 1: Repository Extension (Recommended for v0.3+)

```typescript
// src/repositories/UserRepository.ts
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

export const UserRepository = AppDataSource.getRepository(User).extend({
  findByEmail(email: string) {
    return this.findOne({ where: { email } });
  },

  findActiveUsers() {
    return this.find({ where: { isActive: true } });
  },

  findWithPagination(page: number, limit: number) {
    return this.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  },

  async findByRole(role: string) {
    return this.createQueryBuilder('user')
      .where('user.role = :role', { role })
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  },

  async updateLastLogin(userId: number) {
    return this.update(userId, {
      lastLoginAt: new Date(),
      loginCount: () => 'loginCount + 1',
    });
  },
});

// Usage
import { UserRepository } from './repositories/UserRepository';

const user = await UserRepository.findByEmail('john@example.com');
const [users, total] = await UserRepository.findWithPagination(1, 10);
```

#### Method 2: Custom Repository Class

```typescript
// src/repositories/UserRepository.ts
import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { AppDataSource } from '../data-source';

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.repository.find({ where: { isActive: true } });
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  async updateUser(id: number, data: Partial<User>): Promise<void> {
    await this.repository.update(id, data);
  }

  async deleteUser(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  // Expose base repository for advanced queries
  getBaseRepository(): Repository<User> {
    return this.repository;
  }
}

// Usage
const userRepo = new UserRepository();
const user = await userRepo.findByEmail('john@example.com');
```

---

### Lesson 4.8: DataSource API vs Repository API

TypeORM offers two ways to interact with the database:

#### Repository API

```typescript
const userRepository = AppDataSource.getRepository(User);
await userRepository.find();
await userRepository.save(user);
```

#### DataSource Manager API

```typescript
// Using EntityManager directly
await AppDataSource.manager.find(User);
await AppDataSource.manager.save(user);

// Useful in transactions
await AppDataSource.transaction(async (manager) => {
  await manager.save(user);
  await manager.save(profile);
});
```

#### When to Use Which?

| Use Case                   | Recommended   |
| -------------------------- | ------------- |
| Standard CRUD operations   | Repository    |
| Custom repository methods  | Repository    |
| Transactions               | EntityManager |
| Multiple entity operations | EntityManager |
| Simple scripts             | Either        |

---

### Lesson 4.9: Best Practices

#### 1. Create a Repository Layer

```typescript
// src/repositories/index.ts
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Post } from '../entities/Post';

export const repositories = {
  user: AppDataSource.getRepository(User),
  post: AppDataSource.getRepository(Post),
};

// Or with custom methods
export const UserRepository = AppDataSource.getRepository(User).extend({
  // custom methods
});
```

#### 2. Use DTOs for Input/Output

```typescript
// Don't expose entity directly
interface CreateUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface UserResponseDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

function toUserResponse(user: User): UserResponseDTO {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}
```

#### 3. Handle Errors Properly

```typescript
async function findUserById(id: number): Promise<User> {
  const user = await userRepository.findOneBy({ id });
  if (!user) {
    throw new Error(`User with id ${id} not found`);
  }
  return user;
}
```

---

## 🎯 Key Takeaways

1. **Repositories** encapsulate database operations for entities
2. Use **find()** for multiple records, **findOne()** for single
3. **save()** handles both insert and update
4. **update()** and **delete()** are faster but don't trigger hooks
5. Use **operators** for complex where conditions
6. Create **custom repositories** for reusable queries
7. Use **EntityManager** for transactions

---

## ✅ Quiz

1. What's the difference between `find()` and `findOne()`?
2. How do you implement pagination with TypeORM?
3. What's the difference between `save()` and `insert()`?
4. How do you soft delete a record?
5. What operator would you use to find users older than 18?
6. How do you create a custom repository in TypeORM v0.3+?

<details>
<summary>View Answers</summary>

1. `find()` returns an array of entities, `findOne()` returns a single entity or null
2. Use `skip` and `take` options: `{ skip: 0, take: 10 }`
3. `save()` can insert or update and returns the entity; `insert()` only inserts and returns InsertResult
4. Use `softDelete()` or `softRemove()` (requires `@DeleteDateColumn`)
5. `MoreThan(18)` operator
6. Use `AppDataSource.getRepository(Entity).extend({ ... })`

</details>

---

## 📝 Homework

1. Create a custom repository for a `Product` entity with methods:
   - `findByCategory(category: string)`
   - `findInStock()`
   - `findWithPagination(page, limit)`
   - `updateStock(id, quantity)`

2. Implement a search function that uses `Like` and `ILike` operators

3. Create a function that uses `findAndCount` for paginated API responses

---

## 📚 Further Reading

- [TypeORM Repository API](https://typeorm.io/repository-api)
- [TypeORM Find Options](https://typeorm.io/find-options)
- [TypeORM Custom Repositories](https://typeorm.io/custom-repository)

---

## ➡️ Next Section

[Section 05: CRUD APIs with Express](../section-05-crud-express/README.md)
