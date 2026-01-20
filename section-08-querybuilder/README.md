# Section 08: QueryBuilder

## 📚 Learning Objectives

By the end of this section, you will:

- Master the QueryBuilder API
- Build complex SELECT queries
- Perform INSERT, UPDATE, DELETE operations
- Use joins, subqueries, and raw expressions
- Know when to use QueryBuilder vs Repository

---

## 📖 Lessons

### Lesson 8.1: Introduction to QueryBuilder

QueryBuilder provides a fluent API for building SQL queries programmatically.

```typescript
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.isActive = :active', { active: true })
  .orderBy('user.createdAt', 'DESC')
  .getMany();
```

#### When to Use QueryBuilder

| Use Case                  | Recommended        |
| ------------------------- | ------------------ |
| Simple CRUD               | Repository methods |
| Complex WHERE conditions  | QueryBuilder       |
| Joins with conditions     | QueryBuilder       |
| Aggregations (COUNT, SUM) | QueryBuilder       |
| Subqueries                | QueryBuilder       |
| Raw SQL expressions       | QueryBuilder       |

---

### Lesson 8.2: SELECT Queries

#### Basic Select

```typescript
// Select all columns
const users = await userRepository.createQueryBuilder('user').getMany();

// Select specific columns
const users = await userRepository
  .createQueryBuilder('user')
  .select(['user.id', 'user.email', 'user.firstName'])
  .getMany();

// Add columns
const users = await userRepository.createQueryBuilder('user').select('user.id').addSelect('user.email').getMany();
```

#### WHERE Conditions

```typescript
// Simple where
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.isActive = :active', { active: true })
  .getMany();

// AND conditions
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.isActive = :active', { active: true })
  .andWhere('user.role = :role', { role: 'admin' })
  .getMany();

// OR conditions
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.role = :role1', { role1: 'admin' })
  .orWhere('user.role = :role2', { role2: 'moderator' })
  .getMany();

// Complex conditions with Brackets
import { Brackets } from 'typeorm';

const users = await userRepository
  .createQueryBuilder('user')
  .where('user.isActive = :active', { active: true })
  .andWhere(
    new Brackets((qb) => {
      qb.where('user.role = :role1', { role1: 'admin' }).orWhere('user.role = :role2', { role2: 'moderator' });
    }),
  )
  .getMany();
// SQL: WHERE isActive = true AND (role = 'admin' OR role = 'moderator')

// IN clause
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.id IN (:...ids)', { ids: [1, 2, 3, 4, 5] })
  .getMany();

// LIKE
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.email LIKE :email', { email: '%@gmail.com' })
  .getMany();

// ILIKE (case insensitive - PostgreSQL)
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.firstName ILIKE :name', { name: '%john%' })
  .getMany();

// BETWEEN
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.age BETWEEN :min AND :max', { min: 18, max: 65 })
  .getMany();

// IS NULL / IS NOT NULL
const users = await userRepository.createQueryBuilder('user').where('user.deletedAt IS NULL').getMany();
```

#### Ordering and Pagination

```typescript
// Order by
const users = await userRepository
  .createQueryBuilder('user')
  .orderBy('user.createdAt', 'DESC')
  .addOrderBy('user.lastName', 'ASC')
  .getMany();

// Pagination
const users = await userRepository
  .createQueryBuilder('user')
  .skip(0) // offset
  .take(10) // limit
  .getMany();

// With total count
const [users, total] = await userRepository.createQueryBuilder('user').skip(0).take(10).getManyAndCount();
```

#### Getting Results

```typescript
// Get many entities
const users = await qb.getMany();

// Get one entity
const user = await qb.getOne();

// Get one or fail
const user = await qb.getOneOrFail();

// Get raw results
const results = await qb.getRawMany();
const result = await qb.getRawOne();

// Get count
const count = await qb.getCount();

// Check existence
const exists = await qb.getExists();
```

---

### Lesson 8.3: Joins

#### Inner Join

```typescript
// Join and select relation
const users = await userRepository.createQueryBuilder('user').innerJoinAndSelect('user.profile', 'profile').getMany();

// Join without selecting (for filtering)
const users = await userRepository
  .createQueryBuilder('user')
  .innerJoin('user.posts', 'post')
  .where('post.isPublished = :published', { published: true })
  .getMany();
```

#### Left Join

```typescript
// Left join (includes users without posts)
const users = await userRepository.createQueryBuilder('user').leftJoinAndSelect('user.posts', 'post').getMany();

// Left join with condition
const users = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post', 'post.isPublished = :published', { published: true })
  .getMany();
```

#### Multiple Joins

```typescript
const users = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.profile', 'profile')
  .leftJoinAndSelect('user.posts', 'post')
  .leftJoinAndSelect('post.tags', 'tag')
  .leftJoinAndSelect('post.comments', 'comment')
  .where('user.isActive = :active', { active: true })
  .getMany();
```

#### Join with Subquery

```typescript
const users = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect(
    (qb) =>
      qb
        .select('post.authorId', 'authorId')
        .addSelect('COUNT(*)', 'postCount')
        .from(Post, 'post')
        .groupBy('post.authorId'),
    'postStats',
    'postStats.authorId = user.id',
  )
  .getRawMany();
```

---

### Lesson 8.4: Aggregations

```typescript
// Count
const count = await userRepository
  .createQueryBuilder('user')
  .where('user.isActive = :active', { active: true })
  .getCount();

// Sum, Avg, Min, Max
const stats = await postRepository
  .createQueryBuilder('post')
  .select('SUM(post.views)', 'totalViews')
  .addSelect('AVG(post.views)', 'avgViews')
  .addSelect('MAX(post.views)', 'maxViews')
  .addSelect('MIN(post.views)', 'minViews')
  .getRawOne();

// Group By
const postsByAuthor = await postRepository
  .createQueryBuilder('post')
  .select('post.authorId', 'authorId')
  .addSelect('COUNT(*)', 'postCount')
  .groupBy('post.authorId')
  .getRawMany();

// Group By with Having
const activeAuthors = await postRepository
  .createQueryBuilder('post')
  .select('post.authorId', 'authorId')
  .addSelect('COUNT(*)', 'postCount')
  .groupBy('post.authorId')
  .having('COUNT(*) > :minPosts', { minPosts: 5 })
  .getRawMany();
```

---

### Lesson 8.5: Subqueries

#### Subquery in WHERE

```typescript
// Users who have published posts
const users = await userRepository
  .createQueryBuilder('user')
  .where((qb) => {
    const subQuery = qb
      .subQuery()
      .select('post.authorId')
      .from(Post, 'post')
      .where('post.isPublished = :published', { published: true })
      .getQuery();
    return 'user.id IN ' + subQuery;
  })
  .getMany();

// Alternative syntax
const users = await userRepository
  .createQueryBuilder('user')
  .where(
    'user.id IN ' +
      userRepository
        .createQueryBuilder()
        .subQuery()
        .select('post.authorId')
        .from(Post, 'post')
        .where('post.isPublished = true')
        .getQuery(),
  )
  .getMany();
```

#### Subquery in SELECT

```typescript
const users = await userRepository
  .createQueryBuilder('user')
  .select('user.id', 'id')
  .addSelect('user.email', 'email')
  .addSelect((qb) => {
    return qb.subQuery().select('COUNT(*)').from(Post, 'post').where('post.authorId = user.id');
  }, 'postCount')
  .getRawMany();
```

#### Subquery in FROM

```typescript
const result = await AppDataSource.createQueryBuilder()
  .select('subQuery.authorId', 'authorId')
  .addSelect('subQuery.postCount', 'postCount')
  .from((qb) => {
    return qb
      .select('post.authorId', 'authorId')
      .addSelect('COUNT(*)', 'postCount')
      .from(Post, 'post')
      .groupBy('post.authorId');
  }, 'subQuery')
  .where('subQuery.postCount > :min', { min: 5 })
  .getRawMany();
```

---

### Lesson 8.6: INSERT, UPDATE, DELETE

#### Insert

```typescript
// Insert single record
await AppDataSource.createQueryBuilder()
  .insert()
  .into(User)
  .values({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  })
  .execute();

// Insert multiple records
await AppDataSource.createQueryBuilder()
  .insert()
  .into(User)
  .values([
    { firstName: 'John', email: 'john@example.com' },
    { firstName: 'Jane', email: 'jane@example.com' },
  ])
  .execute();

// Insert with returning (PostgreSQL)
const result = await AppDataSource.createQueryBuilder()
  .insert()
  .into(User)
  .values({ firstName: 'John', email: 'john@example.com' })
  .returning('*')
  .execute();
```

#### Update

```typescript
// Update by condition
await AppDataSource.createQueryBuilder()
  .update(User)
  .set({ isActive: false })
  .where('lastLoginAt < :date', { date: new Date('2024-01-01') })
  .execute();

// Update with raw SQL expression
await AppDataSource.createQueryBuilder()
  .update(User)
  .set({
    loginCount: () => 'loginCount + 1',
    lastLoginAt: new Date(),
  })
  .where('id = :id', { id: 1 })
  .execute();

// Update with returning
const result = await AppDataSource.createQueryBuilder()
  .update(User)
  .set({ isActive: true })
  .where('id = :id', { id: 1 })
  .returning('*')
  .execute();
```

#### Delete

```typescript
// Delete by condition
await AppDataSource.createQueryBuilder().delete().from(User).where('isActive = :active', { active: false }).execute();

// Soft delete
await AppDataSource.createQueryBuilder().softDelete().from(User).where('id = :id', { id: 1 }).execute();

// Restore soft deleted
await AppDataSource.createQueryBuilder().restore().from(User).where('id = :id', { id: 1 }).execute();
```

---

### Lesson 8.7: Raw Queries

```typescript
// Execute raw SQL
const users = await AppDataSource.query(`SELECT * FROM users WHERE email = $1`, ['john@example.com']);

// Raw expression in QueryBuilder
const users = await userRepository
  .createQueryBuilder('user')
  .where('EXTRACT(YEAR FROM user.createdAt) = :year', { year: 2024 })
  .getMany();

// Raw in select
const users = await userRepository
  .createQueryBuilder('user')
  .select('user.id', 'id')
  .addSelect("CONCAT(user.firstName, ' ', user.lastName)", 'fullName')
  .addSelect("DATE_PART('year', AGE(user.birthDate))", 'age')
  .getRawMany();
```

---

### Lesson 8.8: Query Caching

```typescript
// Enable caching for a query
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.isActive = :active', { active: true })
  .cache(true) // Cache with default duration
  .getMany();

// Cache with custom duration (milliseconds)
const users = await userRepository
  .createQueryBuilder('user')
  .cache(60000) // 1 minute
  .getMany();

// Cache with ID (for invalidation)
const users = await userRepository.createQueryBuilder('user').cache('active_users', 60000).getMany();

// Clear specific cache
await AppDataSource.queryResultCache?.remove(['active_users']);

// Clear all cache
await AppDataSource.queryResultCache?.clear();
```

---

### Lesson 8.9: Practical Examples

#### Search with Multiple Filters

```typescript
interface SearchParams {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

async function searchUsers(params: SearchParams) {
  const { search, role, isActive, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = params;

  const qb = userRepository.createQueryBuilder('user');

  // Search in multiple fields
  if (search) {
    qb.andWhere(
      new Brackets((qb) => {
        qb.where('user.firstName ILIKE :search', { search: `%${search}%` })
          .orWhere('user.lastName ILIKE :search', { search: `%${search}%` })
          .orWhere('user.email ILIKE :search', { search: `%${search}%` });
      }),
    );
  }

  // Filter by role
  if (role) {
    qb.andWhere('user.role = :role', { role });
  }

  // Filter by active status
  if (isActive !== undefined) {
    qb.andWhere('user.isActive = :isActive', { isActive });
  }

  // Sorting
  qb.orderBy(`user.${sortBy}`, sortOrder);

  // Pagination
  qb.skip((page - 1) * limit).take(limit);

  const [users, total] = await qb.getManyAndCount();

  return {
    data: users,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

#### Complex Report Query

```typescript
async function getAuthorStats() {
  return userRepository
    .createQueryBuilder('user')
    .select('user.id', 'authorId')
    .addSelect('user.firstName', 'firstName')
    .addSelect('user.lastName', 'lastName')
    .addSelect('COUNT(DISTINCT post.id)', 'totalPosts')
    .addSelect('COUNT(DISTINCT comment.id)', 'totalComments')
    .addSelect('COALESCE(SUM(post.views), 0)', 'totalViews')
    .leftJoin('user.posts', 'post')
    .leftJoin('post.comments', 'comment')
    .groupBy('user.id')
    .orderBy('totalPosts', 'DESC')
    .getRawMany();
}
```

---

## 🎯 Key Takeaways

1. **QueryBuilder** is for complex queries beyond simple CRUD
2. Use **Brackets** for complex AND/OR conditions
3. **leftJoinAndSelect** loads relations; **leftJoin** just filters
4. Use **getRawMany()** for aggregations and custom selects
5. **Subqueries** enable powerful nested queries
6. Always use **parameterized queries** to prevent SQL injection

---

## ✅ Quiz

1. When should you use QueryBuilder over Repository methods?
2. What's the difference between `getMany()` and `getRawMany()`?
3. How do you create complex AND/OR conditions?
4. What method do you use for pagination?
5. How do you increment a column value atomically?

<details>
<summary>View Answers</summary>

1. Complex WHERE, joins with conditions, aggregations, subqueries
2. `getMany()` returns entities; `getRawMany()` returns raw objects
3. Use `Brackets` class with nested `where`/`orWhere`
4. `skip()` and `take()`
5. Use raw expression: `.set({ count: () => "count + 1" })`

</details>

---

## 📝 Homework

1. Build a search function with filters, sorting, and pagination
2. Create a report query with aggregations
3. Write a query using subqueries
4. Implement a bulk update using QueryBuilder

---

## ➡️ Next Section

[Section 09: Soft Deletes](../section-09-soft-deletes/README.md)
