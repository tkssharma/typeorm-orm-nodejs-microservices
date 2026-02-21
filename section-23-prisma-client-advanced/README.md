# Section 23: Prisma Client Advanced Patterns

## Topics Covered

### 1. Prisma Client Deep Dive
- Generated client internals
- Client instantiation patterns
- Connection management
- Client extensions API

### 2. Advanced Query Patterns
```typescript
// Nested reads with multiple levels
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    posts: {
      include: {
        comments: {
          include: { author: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    },
    profile: true
  }
});

// Fluent API chaining
const posts = await prisma.user
  .findUnique({ where: { id: userId } })
  .posts({ where: { published: true } });
```

### 3. Transactions in Prisma
```typescript
// Sequential transactions
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.post.create({ data: postData })
]);

// Interactive transactions
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  
  await tx.account.update({
    where: { userId: user.id },
    data: { balance: { decrement: amount } }
  });
  
  await tx.transaction.create({
    data: { userId: user.id, amount, type: 'DEBIT' }
  });
});

// Transaction options
await prisma.$transaction(
  async (tx) => { /* ... */ },
  {
    maxWait: 5000,      // Max time to acquire connection
    timeout: 10000,     // Max transaction duration
    isolationLevel: 'Serializable'
  }
);
```

### 4. Raw SQL Queries
```typescript
// Tagged template literals (safe from injection)
const users = await prisma.$queryRaw`
  SELECT * FROM "User" 
  WHERE email LIKE ${`%${domain}`}
  ORDER BY "createdAt" DESC
`;

// Execute raw (for INSERT, UPDATE, DELETE)
const affected = await prisma.$executeRaw`
  UPDATE "User" 
  SET "lastLogin" = NOW() 
  WHERE id = ${userId}
`;

// Dynamic raw queries (use with caution)
import { Prisma } from '@prisma/client';

const orderBy = Prisma.sql`ORDER BY "createdAt" DESC`;
const users = await prisma.$queryRaw`
  SELECT * FROM "User" ${orderBy}
`;
```

### 5. Middleware & Extensions
```typescript
// Logging middleware
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  console.log(`${params.model}.${params.action} took ${after - before}ms`);
  return result;
});

// Soft delete middleware
prisma.$use(async (params, next) => {
  if (params.model === 'User') {
    if (params.action === 'delete') {
      params.action = 'update';
      params.args['data'] = { deletedAt: new Date() };
    }
    if (params.action === 'findMany') {
      params.args.where = { ...params.args.where, deletedAt: null };
    }
  }
  return next(params);
});

// Client extensions (Prisma 4.16+)
const xprisma = prisma.$extends({
  model: {
    user: {
      async signUp(email: string, password: string) {
        const hashedPassword = await hash(password);
        return prisma.user.create({
          data: { email, password: hashedPassword }
        });
      }
    }
  },
  result: {
    user: {
      fullName: {
        needs: { firstName: true, lastName: true },
        compute(user) {
          return `${user.firstName} ${user.lastName}`;
        }
      }
    }
  }
});
```

### 6. Optimistic Concurrency Control
```typescript
// Using version field for optimistic locking
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  version   Int      @default(0)
  updatedAt DateTime @updatedAt
}

// Update with version check
async function updatePost(id: number, title: string, expectedVersion: number) {
  const result = await prisma.post.updateMany({
    where: { 
      id, 
      version: expectedVersion 
    },
    data: { 
      title, 
      version: { increment: 1 } 
    }
  });
  
  if (result.count === 0) {
    throw new Error('Concurrent modification detected');
  }
}
```

### 7. Connection Pooling & Performance
```typescript
// Connection URL with pool settings
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30"

// Prisma Client singleton
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

---

## Prerequisites
- Completed Section 19 (Prisma Client & CRUD)
- Understanding of SQL transactions
- Docker (for local PostgreSQL)

## Getting Started

```bash
# Start PostgreSQL
docker-compose -f docker-compose.postgres.yml up -d

# Setup demo
cd section-23-prisma-client-advanced/demo
cp .env.example .env
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm dev
```

## Key Takeaways

- **Interactive transactions** give you full control over transaction flow
- **Middleware** enables cross-cutting concerns like logging and soft deletes
- **Client extensions** add custom methods to models and computed fields
- **Raw SQL** is available when Prisma's query API isn't enough
- **Connection pooling** is critical for production performance
