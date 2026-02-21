# Section 29: Prisma Production Best Practices

## Topics Covered

### 1. Production Configuration
- Environment-based settings
- Secure connection strings
- Logging configuration
- Error handling

### 2. Secure Database Connection
```typescript
// Use connection string from environment
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"

// With SSL certificate
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=verify-full&sslrootcert=/path/to/ca.pem"
```

```typescript
// src/db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  },
  log: process.env.NODE_ENV === 'production' 
    ? ['error', 'warn'] 
    : ['query', 'info', 'warn', 'error']
});

export default prisma;
```

### 3. Connection Pooling Settings
```env
# Production connection URL with pool settings
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30&connect_timeout=10"
```

| Parameter | Description | Recommended |
|-----------|-------------|-------------|
| `connection_limit` | Max connections per client | 10-20 |
| `pool_timeout` | Wait time for connection | 20-30s |
| `connect_timeout` | Initial connection timeout | 10s |
| `statement_cache_size` | Prepared statement cache | 100 |

### 4. Health Checks
```typescript
// src/health.ts
import prisma from './db';

export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      latency: Date.now() - start
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Express health endpoint
app.get('/health', async (req, res) => {
  const db = await checkDatabaseHealth();
  
  if (db.status === 'unhealthy') {
    return res.status(503).json({ status: 'unhealthy', db });
  }
  
  res.json({ status: 'healthy', db });
});
```

### 5. Graceful Shutdown
```typescript
// src/server.ts
import prisma from './db';
import { createServer } from 'http';

const server = createServer(app);

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  // Disconnect from database
  await prisma.$disconnect();
  console.log('Database disconnected');
  
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await prisma.$disconnect();
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled rejection:', reason);
  await prisma.$disconnect();
  process.exit(1);
});
```

### 6. Error Handling
```typescript
// src/errors.ts
import { Prisma } from '@prisma/client';

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handlePrismaError(error: unknown): DatabaseError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new DatabaseError(
          'Record already exists',
          'DUPLICATE_ENTRY',
          409
        );
      case 'P2025':
        return new DatabaseError(
          'Record not found',
          'NOT_FOUND',
          404
        );
      case 'P2003':
        return new DatabaseError(
          'Foreign key constraint failed',
          'FOREIGN_KEY_VIOLATION',
          400
        );
      default:
        return new DatabaseError(
          'Database error',
          error.code,
          500
        );
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new DatabaseError(
      'Invalid data provided',
      'VALIDATION_ERROR',
      400
    );
  }
  
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError(
      'Database connection failed',
      'CONNECTION_ERROR',
      503
    );
  }
  
  return new DatabaseError(
    'Internal server error',
    'UNKNOWN_ERROR',
    500
  );
}

// Usage in routes
app.post('/users', async (req, res, next) => {
  try {
    const user = await prisma.user.create({ data: req.body });
    res.status(201).json(user);
  } catch (error) {
    const dbError = handlePrismaError(error);
    res.status(dbError.statusCode).json({
      error: dbError.message,
      code: dbError.code
    });
  }
});
```

### 7. Logging & Monitoring
```typescript
// src/db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ]
});

// Log slow queries
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn(`Slow query (${e.duration}ms):`, e.query);
  }
});

prisma.$on('error', (e) => {
  console.error('Prisma error:', e);
  // Send to error tracking service (Sentry, etc.)
});

// Metrics middleware
const queryMetrics = {
  total: 0,
  errors: 0,
  totalDuration: 0
};

prisma.$use(async (params, next) => {
  const start = Date.now();
  try {
    const result = await next(params);
    queryMetrics.total++;
    queryMetrics.totalDuration += Date.now() - start;
    return result;
  } catch (error) {
    queryMetrics.errors++;
    throw error;
  }
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    queries: {
      total: queryMetrics.total,
      errors: queryMetrics.errors,
      avgDuration: queryMetrics.total > 0 
        ? queryMetrics.totalDuration / queryMetrics.total 
        : 0
    }
  });
});
```

### 8. Migration Strategy
```bash
# CI/CD Pipeline
# 1. Run migrations before deploying new code
npx prisma migrate deploy

# 2. Generate Prisma Client
npx prisma generate

# 3. Deploy application
npm start
```

```yaml
# GitHub Actions example
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Generate Prisma Client
        run: npx prisma generate
      
      - name: Deploy
        run: npm run deploy
```

### 9. Backup & Recovery
```typescript
// Automated backup script
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  
  const { DATABASE_URL } = process.env;
  
  await execAsync(`pg_dump ${DATABASE_URL} > ./backups/${filename}`);
  
  // Upload to S3 or other storage
  await uploadToS3(`./backups/${filename}`);
  
  console.log(`Backup completed: ${filename}`);
}

// Run backup daily
setInterval(backupDatabase, 24 * 60 * 60 * 1000);
```

### 10. Security Checklist

| Item | Description |
|------|-------------|
| ✅ SSL/TLS | Use `sslmode=require` or `verify-full` |
| ✅ Credentials | Store in environment variables, never in code |
| ✅ Network | Use private subnets, VPC peering |
| ✅ Access | Principle of least privilege for DB users |
| ✅ Auditing | Enable query logging for compliance |
| ✅ Encryption | Encrypt data at rest (RDS encryption) |
| ✅ Secrets | Use AWS Secrets Manager or similar |

---

## Prerequisites
- Completed Section 23-28 (Prisma sections)
- Understanding of production deployment
- Docker and CI/CD basics

## Getting Started

```bash
cd section-29-prisma-production/demo
cp .env.example .env
pnpm install
pnpm prisma generate
pnpm build
pnpm start
```

## Key Takeaways

- **Connection pooling** prevents connection exhaustion
- **Health checks** enable proper load balancer integration
- **Graceful shutdown** prevents data corruption
- **Error handling** provides meaningful error responses
- **Logging** is essential for debugging and monitoring
- **Migrations** should run before deploying new code
