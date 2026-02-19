# Section 19: Prisma Client & CRUD Operations

## Topics Covered

### 1. Prisma Client Setup & Generation
- Running `prisma generate`
- Importing PrismaClient
- Client instantiation patterns
- Connection handling

### 2. Create Operations (Single & Bulk)
- `create()` - Single record
- `createMany()` - Bulk insert
- Nested creates
- Return created data

### 3. Read Operations (findUnique, findMany)
- `findUnique()` - By unique field
- `findFirst()` - First matching
- `findMany()` - Multiple records
- `findUniqueOrThrow()` / `findFirstOrThrow()`

### 4. Update & Upsert Operations
- `update()` - Update single
- `updateMany()` - Bulk update
- `upsert()` - Update or create
- Increment/decrement operations

### 5. Delete & Soft Delete Patterns
- `delete()` - Single delete
- `deleteMany()` - Bulk delete
- Soft delete implementation
- Middleware for soft deletes

### 6. Select vs Include
- `select` - Pick specific fields
- `include` - Include relations
- Nested select/include
- Performance implications

### 7. Filtering, Sorting & Pagination
- `where` clause filters
- `equals`, `contains`, `startsWith`, `endsWith`
- `in`, `notIn`, `lt`, `lte`, `gt`, `gte`
- `orderBy` - Sorting
- `skip` & `take` - Pagination
- Cursor-based pagination

## Code Examples

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe',
    profile: {
      create: { bio: 'Developer' }
    }
  },
  include: { profile: true }
});

// Read
const users = await prisma.user.findMany({
  where: {
    email: { contains: '@example.com' }
  },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10
});

// Update
const updated = await prisma.user.update({
  where: { id: 'user-id' },
  data: { name: 'Jane Doe' }
});

// Upsert
const upserted = await prisma.user.upsert({
  where: { email: 'john@example.com' },
  update: { name: 'John Updated' },
  create: { email: 'john@example.com', name: 'John' }
});

// Delete
await prisma.user.delete({
  where: { id: 'user-id' }
});
```

## Getting Started
```bash
cd section-19-prisma-client-crud/demo
pnpm install
pnpm prisma generate
pnpm dev
```
