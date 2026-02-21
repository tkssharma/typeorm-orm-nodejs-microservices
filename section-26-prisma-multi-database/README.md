# Section 26: Prisma Multi-Database Strategies

## Topics Covered

### 1. Multi-Database Overview
- When you need multiple databases
- Read replicas pattern
- Multi-tenant architectures
- Database per service (microservices)

### 2. Multiple Prisma Clients
```prisma
// prisma/schema.prisma (Primary - PostgreSQL)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client/primary"
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String?
}
```

```prisma
// prisma/analytics.prisma (Analytics - PostgreSQL)
datasource db {
  provider = "postgresql"
  url      = env("ANALYTICS_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client/analytics"
}

model Event {
  id        Int      @id @default(autoincrement())
  type      String
  userId    Int
  data      Json
  createdAt DateTime @default(now())
}
```

```typescript
// src/db/clients.ts
import { PrismaClient as PrimaryClient } from '.prisma/client/primary';
import { PrismaClient as AnalyticsClient } from '.prisma/client/analytics';

export const primaryDb = new PrimaryClient();
export const analyticsDb = new AnalyticsClient();

// Usage
const user = await primaryDb.user.findUnique({ where: { id: 1 } });
const events = await analyticsDb.event.findMany({ 
  where: { userId: user.id } 
});
```

### 3. Read Replica Pattern
```typescript
// Connection URLs
PRIMARY_DATABASE_URL="postgresql://user:pass@primary:5432/db"
REPLICA_DATABASE_URL="postgresql://user:pass@replica:5432/db"

// src/db/replica.ts
import { PrismaClient } from '@prisma/client';

const primaryDb = new PrismaClient({
  datasources: { db: { url: process.env.PRIMARY_DATABASE_URL } }
});

const replicaDb = new PrismaClient({
  datasources: { db: { url: process.env.REPLICA_DATABASE_URL } }
});

// Read from replica, write to primary
export async function getUser(id: number) {
  return replicaDb.user.findUnique({ where: { id } });
}

export async function createUser(data: { email: string; name: string }) {
  return primaryDb.user.create({ data });
}

// Smart routing based on operation type
export function getClient(operation: 'read' | 'write') {
  return operation === 'read' ? replicaDb : primaryDb;
}
```

### 4. Multi-Tenant Database per Tenant
```typescript
// Tenant database URL pattern
// tenant_abc -> postgresql://user:pass@host/tenant_abc
// tenant_xyz -> postgresql://user:pass@host/tenant_xyz

import { PrismaClient } from '@prisma/client';

// Connection pool per tenant
const tenantClients = new Map<string, PrismaClient>();

export function getTenantClient(tenantId: string): PrismaClient {
  if (!tenantClients.has(tenantId)) {
    const client = new PrismaClient({
      datasources: {
        db: { url: `postgresql://user:pass@host/${tenantId}` }
      }
    });
    tenantClients.set(tenantId, client);
  }
  return tenantClients.get(tenantId)!;
}

// Middleware to inject tenant client
app.use((req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return res.status(400).json({ error: 'Missing tenant ID' });
  }
  req.prisma = getTenantClient(tenantId);
  next();
});

// Usage in route
app.get('/users', async (req, res) => {
  const users = await req.prisma.user.findMany();
  res.json(users);
});
```

### 5. Schema-Based Multi-Tenancy
```prisma
// Single database, multiple schemas
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["tenant_a", "tenant_b", "public"]
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  
  @@schema("tenant_a")  // Specify schema per model
}
```

```typescript
// Dynamic schema selection (raw queries)
async function getUsersFromTenant(tenantSchema: string) {
  return prisma.$queryRawUnsafe(`
    SELECT * FROM "${tenantSchema}"."User"
  `);
}
```

### 6. Cross-Database Joins (Application Level)
```typescript
// Since Prisma doesn't support cross-database joins,
// handle at application level

async function getUserWithAnalytics(userId: number) {
  // Parallel queries to different databases
  const [user, events] = await Promise.all([
    primaryDb.user.findUnique({ where: { id: userId } }),
    analyticsDb.event.findMany({ 
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
  ]);

  return { ...user, events };
}

// Batch cross-database queries
async function getUsersWithEventCounts(userIds: number[]) {
  const [users, eventCounts] = await Promise.all([
    primaryDb.user.findMany({
      where: { id: { in: userIds } }
    }),
    analyticsDb.event.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true }
    })
  ]);

  // Merge results
  const countsMap = new Map(
    eventCounts.map(e => [e.userId, e._count.id])
  );

  return users.map(user => ({
    ...user,
    eventCount: countsMap.get(user.id) || 0
  }));
}
```

### 7. Database Connection Management
```typescript
// Connection pool settings per database
const primaryDb = new PrismaClient({
  datasources: {
    db: { 
      url: `${process.env.PRIMARY_DATABASE_URL}?connection_limit=10&pool_timeout=20` 
    }
  }
});

const replicaDb = new PrismaClient({
  datasources: {
    db: { 
      url: `${process.env.REPLICA_DATABASE_URL}?connection_limit=30&pool_timeout=10` 
    }
  }
});

// Graceful shutdown for all clients
async function shutdown() {
  await Promise.all([
    primaryDb.$disconnect(),
    replicaDb.$disconnect(),
    ...Array.from(tenantClients.values()).map(c => c.$disconnect())
  ]);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

### 8. Migrations for Multiple Databases
```bash
# Generate migrations for each schema
npx prisma migrate dev --schema=prisma/schema.prisma
npx prisma migrate dev --schema=prisma/analytics.prisma

# Deploy to production
npx prisma migrate deploy --schema=prisma/schema.prisma
npx prisma migrate deploy --schema=prisma/analytics.prisma

# Generate clients
npx prisma generate --schema=prisma/schema.prisma
npx prisma generate --schema=prisma/analytics.prisma
```

```json
// package.json scripts
{
  "scripts": {
    "prisma:generate": "prisma generate --schema=prisma/schema.prisma && prisma generate --schema=prisma/analytics.prisma",
    "prisma:migrate": "prisma migrate dev --schema=prisma/schema.prisma && prisma migrate dev --schema=prisma/analytics.prisma",
    "prisma:deploy": "prisma migrate deploy --schema=prisma/schema.prisma && prisma migrate deploy --schema=prisma/analytics.prisma"
  }
}
```

---

## Prerequisites
- Completed Section 23 (Prisma Client Advanced)
- Understanding of database architecture patterns
- Docker (for multiple PostgreSQL instances)

## Getting Started

```bash
# Start multiple PostgreSQL instances
docker-compose -f docker-compose.postgres.yml up -d

# Setup demo
cd section-26-prisma-multi-database/demo
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

## Key Takeaways

- **Multiple clients** allow connecting to different databases
- **Read replicas** improve read performance and reduce primary load
- **Multi-tenancy** can be database-per-tenant or schema-per-tenant
- **Cross-database joins** must be handled at application level
- **Connection management** is critical with multiple databases
