# Section 20: Prisma Advanced Queries

## Topics Covered

### 1. Aggregations (count, sum, avg, min, max)
- `count()` - Count records
- `aggregate()` - Multiple aggregations
- `_sum`, `_avg`, `_min`, `_max`
- Filtering in aggregations

### 2. GroupBy Queries
- `groupBy()` method
- Grouping by single field
- Grouping by multiple fields
- Having clause equivalent
- Aggregations with groupBy

### 3. Nested Writes
- Creating related records
- `create`, `connect`, `connectOrCreate`
- `set`, `disconnect`, `delete`
- Deep nesting strategies

### 4. Transactions ($transaction)
- Sequential transactions
- Interactive transactions
- Transaction isolation levels
- Rollback behavior
- Nested transactions

### 5. Raw Queries ($queryRaw & $executeRaw)
- `$queryRaw` - SELECT queries
- `$executeRaw` - INSERT/UPDATE/DELETE
- Parameterized queries
- SQL injection prevention
- `$queryRawUnsafe` - Dynamic queries

### 6. Full-Text Search (Postgres / MySQL)
- PostgreSQL full-text search
- MySQL full-text indexes
- Search configuration
- Relevance scoring

## Code Examples

```typescript
// Aggregations
const stats = await prisma.post.aggregate({
  _count: { id: true },
  _avg: { views: true },
  _sum: { likes: true },
  where: { published: true }
});

// GroupBy
const postsByAuthor = await prisma.post.groupBy({
  by: ['authorId'],
  _count: { id: true },
  _sum: { views: true },
  having: {
    views: { _sum: { gt: 100 } }
  }
});

// Interactive Transaction
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'test@example.com', name: 'Test' }
  });
  
  const post = await tx.post.create({
    data: { title: 'First Post', authorId: user.id }
  });
  
  return { user, post };
});

// Raw Query
const users = await prisma.$queryRaw`
  SELECT * FROM "User" 
  WHERE email LIKE ${`%@example.com`}
`;

// Full-Text Search (PostgreSQL)
const searchResults = await prisma.post.findMany({
  where: {
    title: { search: 'database & prisma' }
  }
});
```

## Getting Started
```bash
cd section-20-prisma-advanced-queries/demo
pnpm install
pnpm prisma db push
pnpm dev
```
