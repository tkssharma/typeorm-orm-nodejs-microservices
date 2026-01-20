# Section 12: Performance Tuning

## 📚 Learning Objectives

By the end of this section, you will:

- Optimize database queries
- Implement proper indexing
- Configure connection pooling
- Use caching effectively
- Debug and profile queries

---

## 📖 Lessons

### Lesson 12.1: Common Performance Issues

| Issue              | Symptom                    | Solution                |
| ------------------ | -------------------------- | ----------------------- |
| N+1 Queries        | Many small queries         | Use joins/eager loading |
| Missing Indexes    | Slow WHERE/ORDER BY        | Add indexes             |
| Over-fetching      | Loading unused data        | Select specific columns |
| No Connection Pool | Connection timeouts        | Configure pooling       |
| No Caching         | Repeated identical queries | Enable caching          |

---

### Lesson 12.2: Solving N+1 Query Problem

#### The Problem

```typescript
// ❌ N+1 Problem: 1 query for users + N queries for posts
const users = await userRepository.find();
for (const user of users) {
  const posts = await postRepository.find({ where: { authorId: user.id } });
  console.log(user.name, posts.length);
}
```

#### Solution 1: Eager Loading with Relations

```typescript
// ✅ Single query with JOIN
const users = await userRepository.find({
  relations: ['posts'],
});
```

#### Solution 2: QueryBuilder with Joins

```typescript
// ✅ More control over the join
const users = await userRepository.createQueryBuilder('user').leftJoinAndSelect('user.posts', 'post').getMany();
```

#### Solution 3: Load Relation Separately (Batch)

```typescript
// ✅ Two queries instead of N+1
const users = await userRepository.find();
const userIds = users.map((u) => u.id);

const posts = await postRepository.find({
  where: { authorId: In(userIds) },
});

// Group posts by author
const postsByAuthor = posts.reduce((acc, post) => {
  acc[post.authorId] = acc[post.authorId] || [];
  acc[post.authorId].push(post);
  return acc;
}, {});
```

---

### Lesson 12.3: Database Indexing

#### Adding Indexes to Entities

```typescript
import { Entity, Column, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
@Index(['email'], { unique: true }) // Unique index
@Index(['firstName', 'lastName']) // Composite index
@Index(['createdAt']) // Single column index
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index() // Index on single column
  @Column()
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  createdAt: Date;
}
```

#### Index Types

```typescript
// B-tree index (default, good for equality and range)
@Index(["email"])

// Unique index
@Index(["email"], { unique: true })

// Partial index (PostgreSQL)
@Index(["email"], { where: '"isActive" = true' })

// Full-text index (for search)
// Created via migration
```

#### Creating Indexes in Migrations

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexes implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    // B-tree index
    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);

    // Partial index
    await queryRunner.query(`
      CREATE INDEX "IDX_users_active_email" 
      ON "users" ("email") 
      WHERE "isActive" = true
    `);

    // GIN index for JSONB
    await queryRunner.query(`
      CREATE INDEX "IDX_users_preferences" 
      ON "users" USING GIN ("preferences")
    `);

    // Full-text search index
    await queryRunner.query(`
      CREATE INDEX "IDX_posts_search" 
      ON "posts" USING GIN (to_tsvector('english', "title" || ' ' || "content"))
    `);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_users_active_email"`);
    await queryRunner.query(`DROP INDEX "IDX_users_preferences"`);
    await queryRunner.query(`DROP INDEX "IDX_posts_search"`);
  }
}
```

#### When to Add Indexes

| Add Index When         | Don't Add When              |
| ---------------------- | --------------------------- |
| Column in WHERE clause | Table is small (<1000 rows) |
| Column in ORDER BY     | Column rarely queried       |
| Column in JOIN         | Column has low cardinality  |
| Foreign key columns    | Write-heavy table           |

---

### Lesson 12.4: Select Only What You Need

```typescript
// ❌ Fetches all columns
const users = await userRepository.find();

// ✅ Select specific columns
const users = await userRepository.find({
  select: ['id', 'firstName', 'email'],
});

// ✅ With QueryBuilder
const users = await userRepository
  .createQueryBuilder('user')
  .select(['user.id', 'user.firstName', 'user.email'])
  .getMany();

// ✅ For aggregations, use getRawMany
const stats = await userRepository
  .createQueryBuilder('user')
  .select('user.role', 'role')
  .addSelect('COUNT(*)', 'count')
  .groupBy('user.role')
  .getRawMany();
```

---

### Lesson 12.5: Connection Pooling

```typescript
// src/data-source.ts
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Connection pool settings
  extra: {
    // Maximum connections in pool
    max: 20,

    // Minimum connections to keep
    min: 5,

    // Idle timeout (ms)
    idleTimeoutMillis: 30000,

    // Connection timeout (ms)
    connectionTimeoutMillis: 5000,

    // Max uses per connection before recycling
    maxUses: 7500,
  },
});
```

#### Pool Size Guidelines

| Application Type | Recommended Pool Size            |
| ---------------- | -------------------------------- |
| Small app        | 5-10                             |
| Medium app       | 10-20                            |
| Large app        | 20-50                            |
| Formula          | (CPU cores \* 2) + disk spindles |

---

### Lesson 12.6: Query Caching

#### Enable Caching in DataSource

```typescript
export const AppDataSource = new DataSource({
  // ... other options

  cache: {
    type: "database",  // or "redis", "ioredis"
    tableName: "query_cache",
    duration: 60000,   // Default cache duration (ms)
  },
});

// For Redis
cache: {
  type: "ioredis",
  options: {
    host: "localhost",
    port: 6379,
  },
  duration: 60000,
}
```

#### Using Cache in Queries

```typescript
// Cache for default duration
const users = await userRepository.find({
  cache: true,
});

// Cache for specific duration (ms)
const users = await userRepository.find({
  cache: 60000, // 1 minute
});

// Cache with ID (for invalidation)
const users = await userRepository.find({
  cache: {
    id: 'users_list',
    milliseconds: 60000,
  },
});

// QueryBuilder caching
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.isActive = :active', { active: true })
  .cache('active_users', 60000)
  .getMany();
```

#### Cache Invalidation

```typescript
// Clear specific cache
await AppDataSource.queryResultCache?.remove(['users_list', 'active_users']);

// Clear all cache
await AppDataSource.queryResultCache?.clear();

// Invalidate after mutation
async function updateUser(id: number, data: any) {
  await userRepository.update(id, data);
  await AppDataSource.queryResultCache?.remove(['users_list']);
}
```

---

### Lesson 12.7: Query Logging and Profiling

#### Enable Logging

```typescript
export const AppDataSource = new DataSource({
  // ... other options

  logging: true, // Log all queries

  // Or specific logging
  logging: ['query', 'error', 'warn'],

  // Log slow queries
  maxQueryExecutionTime: 1000, // Log queries taking > 1s
});
```

#### Custom Logger

```typescript
import { Logger, QueryRunner } from 'typeorm';

class CustomLogger implements Logger {
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    console.log('Query:', query);
    console.log('Parameters:', parameters);
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    console.error('Query Error:', error);
    console.error('Query:', query);
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    console.warn(`Slow Query (${time}ms):`, query);
  }

  logSchemaBuild(message: string) {
    console.log('Schema:', message);
  }

  logMigration(message: string) {
    console.log('Migration:', message);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    console.log(`[${level}]`, message);
  }
}

// Use custom logger
export const AppDataSource = new DataSource({
  logger: new CustomLogger(),
});
```

#### Explain Analyze

```typescript
// Get query execution plan
const plan = await AppDataSource.query(`
  EXPLAIN ANALYZE
  SELECT * FROM users WHERE email = 'john@example.com'
`);
console.log(plan);
```

---

### Lesson 12.8: Pagination Best Practices

#### Offset Pagination (Simple but Slow for Large Offsets)

```typescript
// ❌ Slow for large offsets
const users = await userRepository.find({
  skip: 10000,
  take: 20,
});
```

#### Cursor-Based Pagination (Better for Large Datasets)

```typescript
// ✅ Cursor-based pagination
async function getUsers(cursor?: number, limit = 20) {
  const qb = userRepository
    .createQueryBuilder('user')
    .orderBy('user.id', 'ASC')
    .take(limit + 1); // Fetch one extra to check if more exist

  if (cursor) {
    qb.where('user.id > :cursor', { cursor });
  }

  const users = await qb.getMany();
  const hasMore = users.length > limit;

  if (hasMore) {
    users.pop(); // Remove the extra item
  }

  return {
    data: users,
    nextCursor: hasMore ? users[users.length - 1].id : null,
    hasMore,
  };
}
```

#### Keyset Pagination with Multiple Columns

```typescript
async function getUsers(lastCreatedAt?: Date, lastId?: number, limit = 20) {
  const qb = userRepository
    .createQueryBuilder('user')
    .orderBy('user.createdAt', 'DESC')
    .addOrderBy('user.id', 'DESC')
    .take(limit + 1);

  if (lastCreatedAt && lastId) {
    qb.where('(user.createdAt < :lastCreatedAt) OR ' + '(user.createdAt = :lastCreatedAt AND user.id < :lastId)', {
      lastCreatedAt,
      lastId,
    });
  }

  const users = await qb.getMany();
  const hasMore = users.length > limit;

  if (hasMore) users.pop();

  const lastUser = users[users.length - 1];

  return {
    data: users,
    cursor: lastUser ? { createdAt: lastUser.createdAt, id: lastUser.id } : null,
    hasMore,
  };
}
```

---

### Lesson 12.9: Batch Operations

```typescript
// ❌ Slow: Individual inserts
for (const data of items) {
  await repository.save(data);
}

// ✅ Fast: Batch insert
await repository.save(items); // TypeORM batches automatically

// ✅ Even faster: Insert with chunks
const chunkSize = 1000;
for (let i = 0; i < items.length; i += chunkSize) {
  const chunk = items.slice(i, i + chunkSize);
  await repository.insert(chunk);
}

// ✅ Bulk update
await repository
  .createQueryBuilder()
  .update(User)
  .set({ isActive: false })
  .where('lastLoginAt < :date', { date: new Date('2023-01-01') })
  .execute();
```

---

## 🎯 Key Takeaways

1. **N+1 Problem**: Use relations or joins, not loops
2. **Indexes**: Add for WHERE, ORDER BY, JOIN columns
3. **Select**: Only fetch columns you need
4. **Connection Pool**: Configure based on load
5. **Caching**: Cache frequent, stable queries
6. **Pagination**: Use cursor-based for large datasets
7. **Batch**: Use bulk operations for multiple records

---

## ✅ Quiz

1. What is the N+1 query problem?
2. When should you add a database index?
3. What's the benefit of cursor-based pagination?
4. How do you invalidate cached queries?
5. What pool size should you use for a medium app?

<details>
<summary>View Answers</summary>

1. Executing 1 query for parent + N queries for each child's relations
2. For columns used in WHERE, ORDER BY, JOIN, and foreign keys
3. Consistent performance regardless of page number (no offset scanning)
4. `AppDataSource.queryResultCache?.remove(["cache_id"])`
5. 10-20 connections

</details>

---

## 📝 Homework

1. Identify and fix N+1 queries in your application
2. Add indexes to frequently queried columns
3. Implement cursor-based pagination
4. Set up query caching with Redis
5. Profile slow queries with EXPLAIN ANALYZE

---

## ➡️ Next Section

[Section 13: Advanced Topics](../section-13-advanced/README.md)
