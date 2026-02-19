# Section 22: Prisma with Backend Frameworks

## Topics Covered

### 1. Prisma with Express.js
- Project setup
- Prisma client initialization
- Route handlers with Prisma
- Error handling patterns
- Middleware integration

### 2. Prisma with NestJS (Best Architecture)
- NestJS module structure
- PrismaModule setup
- Injectable PrismaService
- Repository pattern

### 3. Prisma Service Pattern
- Singleton pattern
- Service abstraction
- Connection lifecycle
- Graceful shutdown

### 4. Request-Scoped Prisma in NestJS
- Request context
- Scope options
- Transaction context
- Multi-tenancy support

### 5. Handling DB Connections Properly
- Connection pooling
- Connection limits
- Serverless considerations
- Health checks

## Express.js Example

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// src/routes/users.ts
import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

router.post('/', async (req, res) => {
  const user = await prisma.user.create({
    data: req.body,
  });
  res.status(201).json(user);
});

export default router;
```

## NestJS Example

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: CreateUserDto) {
    return this.prisma.user.create({ data });
  }
}
```

## Connection Pooling (Serverless)

```typescript
import { PrismaClient } from '@prisma/client';

// For serverless environments
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection limit for serverless
  // Use connection pooling (e.g., PgBouncer)
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

## Getting Started
```bash
cd section-22-prisma-backend-frameworks/demo
pnpm install
pnpm prisma generate
pnpm dev
```
