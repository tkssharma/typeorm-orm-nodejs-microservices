# Section 27: Prisma Edge & Serverless

## Topics Covered

### 1. Serverless Challenges
- Cold starts and connection limits
- Connection pooling with PgBouncer
- Prisma Accelerate for edge
- Prisma Data Proxy

### 2. AWS Lambda with Prisma
```typescript
// lambda/handler.ts
import { PrismaClient } from '@prisma/client';

// Reuse client across invocations
let prisma: PrismaClient;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL }
      }
    });
  }
  return prisma;
}

export async function handler(event: any) {
  const prisma = getPrismaClient();
  
  try {
    const users = await prisma.user.findMany({
      take: 10
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify(users)
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
```

### 3. Connection Pooling with PgBouncer
```bash
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
    
  pgbouncer:
    image: edoburu/pgbouncer:1.21.0
    environment:
      DATABASE_URL: postgres://postgres:postgres@postgres:5432/mydb
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 20
    ports:
      - "6432:6432"
```

```env
# Connect via PgBouncer
DATABASE_URL="postgresql://postgres:postgres@localhost:6432/mydb?pgbouncer=true"
```

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. Prisma Accelerate (Edge-Ready)
```bash
# Install Prisma Accelerate extension
npm install @prisma/extension-accelerate
```

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

```typescript
// src/db.ts
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// For Prisma Accelerate, use the connection string from Prisma Data Platform
const prisma = new PrismaClient().$extends(withAccelerate());

// Caching with Accelerate
const users = await prisma.user.findMany({
  cacheStrategy: {
    ttl: 60,      // Cache for 60 seconds
    swr: 120      // Stale-while-revalidate for 120 seconds
  }
});

// Skip cache for fresh data
const freshUser = await prisma.user.findUnique({
  where: { id: userId },
  cacheStrategy: { ttl: 0 }
});
```

### 5. Vercel Edge Functions
```typescript
// api/users/route.ts (Next.js App Router)
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

export const runtime = 'edge';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET() {
  const users = await prisma.user.findMany({
    take: 10,
    cacheStrategy: { ttl: 30 }
  });
  
  return Response.json(users);
}
```

### 6. Cloudflare Workers
```typescript
// src/worker.ts
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

export interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const prisma = new PrismaClient({
      datasources: { db: { url: env.DATABASE_URL } }
    }).$extends(withAccelerate());

    const url = new URL(request.url);
    
    if (url.pathname === '/users') {
      const users = await prisma.user.findMany({
        cacheStrategy: { ttl: 60 }
      });
      return Response.json(users);
    }

    return new Response('Not found', { status: 404 });
  }
};
```

### 7. Optimizing for Serverless
```typescript
// Minimize cold start time
const prisma = new PrismaClient({
  // Log only errors in production
  log: process.env.NODE_ENV === 'production' 
    ? ['error'] 
    : ['query', 'info', 'warn', 'error']
});

// Use lazy connection
// Prisma connects on first query, not on instantiation

// Batch operations to reduce round trips
const [users, posts, comments] = await prisma.$transaction([
  prisma.user.findMany({ take: 10 }),
  prisma.post.findMany({ take: 10 }),
  prisma.comment.findMany({ take: 10 })
]);

// Use select to minimize data transfer
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true, name: true }
  // Don't include relations unless needed
});
```

### 8. Handling Connection Limits
```typescript
// Monitor connections
const connectionCount = await prisma.$queryRaw`
  SELECT count(*) FROM pg_stat_activity 
  WHERE datname = current_database()
`;

// Connection URL with limits
DATABASE_URL="postgresql://user:pass@host/db?connection_limit=5&pool_timeout=10"

// Disconnect after long-running operations
export async function batchJob() {
  const prisma = new PrismaClient();
  
  try {
    // Process batch
    for (const item of items) {
      await prisma.item.update({
        where: { id: item.id },
        data: { processed: true }
      });
    }
  } finally {
    // Always disconnect in batch jobs
    await prisma.$disconnect();
  }
}
```

### 9. Error Handling in Serverless
```typescript
import { Prisma } from '@prisma/client';

export async function handler(event: any) {
  try {
    const result = await prisma.user.create({
      data: event.body
    });
    return { statusCode: 201, body: JSON.stringify(result) };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { statusCode: 409, body: 'Duplicate entry' };
      }
      if (error.code === 'P2025') {
        return { statusCode: 404, body: 'Record not found' };
      }
    }
    
    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error('Database connection failed:', error);
      return { statusCode: 503, body: 'Database unavailable' };
    }
    
    console.error('Unexpected error:', error);
    return { statusCode: 500, body: 'Internal error' };
  }
}
```

---

## Prerequisites
- Completed Section 23 (Prisma Client Advanced)
- Understanding of serverless architecture
- AWS/Vercel/Cloudflare account (for deployment)

## Getting Started

```bash
cd section-27-prisma-edge-serverless/demo
cp .env.example .env
pnpm install
pnpm prisma generate
pnpm dev
```

## Key Takeaways

- **Connection pooling** (PgBouncer) is essential for serverless
- **Prisma Accelerate** enables edge deployment with caching
- **Reuse client** across Lambda invocations to reduce cold starts
- **Select only needed fields** to minimize data transfer
- **Handle connection limits** carefully in high-concurrency environments
