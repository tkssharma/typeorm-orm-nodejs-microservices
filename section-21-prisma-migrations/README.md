# Section 21: Prisma Migrations & Database Management

## Topics Covered

### 1. Prisma Migrate Explained
- Migration workflow
- `prisma migrate dev` - Development migrations
- `prisma migrate deploy` - Production migrations
- Migration files structure

### 2. Dev vs Prod Migrations
- Development workflow with `migrate dev`
- Production deployment with `migrate deploy`
- CI/CD integration
- Migration status checking

### 3. Resetting & Seeding Database
- `prisma migrate reset` - Full reset
- Seed file configuration
- `prisma db seed` command
- Conditional seeding

### 4. Prisma Studio Deep Dive
- `prisma studio` command
- Visual data editing
- Filtering and sorting
- Relation navigation

### 5. Handling Schema Changes Safely
- Non-destructive migrations
- Data migration strategies
- Renaming fields/tables
- Adding required fields

### 6. Database Introspection
- `prisma db pull` - Introspect existing DB
- Mapping existing databases
- Schema synchronization
- Legacy database support

## Commands Reference

```bash
# Development migration (creates migration + applies)
prisma migrate dev --name init

# Apply migrations in production
prisma migrate deploy

# Check migration status
prisma migrate status

# Reset database (drops all data!)
prisma migrate reset

# Introspect existing database
prisma db pull

# Push schema without migration
prisma db push

# Seed database
prisma db seed

# Open Prisma Studio
prisma studio
```

## Seed File Example

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.user.deleteMany();

  // Create seed data
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      posts: {
        create: [
          { title: 'Welcome Post', content: 'Hello World!' }
        ]
      }
    }
  });

  console.log('Seeded:', { admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## package.json Seed Config
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

## Getting Started
```bash
cd section-21-prisma-migrations/demo
pnpm install
pnpm prisma migrate dev --name init
pnpm prisma db seed
```
