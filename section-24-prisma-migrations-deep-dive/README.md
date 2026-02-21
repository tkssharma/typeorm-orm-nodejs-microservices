# Section 24: Prisma Migrations Deep Dive

## Topics Covered

### 1. Migration Workflow Explained
- Development vs Production migrations
- Migration files structure
- Migration history table
- Shadow database concept

### 2. Development Migrations
```bash
# Create and apply migration
prisma migrate dev --name add_user_profile

# Create migration without applying
prisma migrate dev --create-only --name add_indexes

# Reset database (drops and recreates)
prisma migrate reset

# Check migration status
prisma migrate status
```

### 3. Production Migrations
```bash
# Apply pending migrations (CI/CD)
prisma migrate deploy

# Resolve failed migrations
prisma migrate resolve --applied "20240101000000_init"
prisma migrate resolve --rolled-back "20240101000000_failed"
```

### 4. Migration File Anatomy
```
prisma/migrations/
├── 20240101000000_init/
│   └── migration.sql
├── 20240115120000_add_profile/
│   └── migration.sql
├── 20240201090000_add_indexes/
│   └── migration.sql
└── migration_lock.toml
```

```sql
-- 20240115120000_add_profile/migration.sql
-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "bio" TEXT,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
```

### 5. Schema Introspection
```bash
# Pull existing database schema into Prisma
prisma db pull

# Push schema without migrations (prototyping only)
prisma db push

# Format schema file
prisma format

# Validate schema
prisma validate
```

### 6. Handling Breaking Changes
```typescript
// Safe: Adding optional field
model User {
  id    Int     @id
  name  String
  bio   String? // New optional field - safe
}

// Requires data migration: Adding required field
model User {
  id     Int    @id
  name   String
  email  String // New required field - needs default or data
}

// Migration with default value
ALTER TABLE "User" ADD COLUMN "email" TEXT NOT NULL DEFAULT 'unknown@example.com';
```

### 7. Data Migrations
```sql
-- 20240201_migrate_data/migration.sql

-- Step 1: Add new column as nullable
ALTER TABLE "User" ADD COLUMN "fullName" TEXT;

-- Step 2: Migrate data
UPDATE "User" SET "fullName" = "firstName" || ' ' || "lastName";

-- Step 3: Make column required
ALTER TABLE "User" ALTER COLUMN "fullName" SET NOT NULL;

-- Step 4: Drop old columns (optional)
-- ALTER TABLE "User" DROP COLUMN "firstName";
-- ALTER TABLE "User" DROP COLUMN "lastName";
```

### 8. Database Seeding
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Seed users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice',
      posts: {
        create: [
          { title: 'Hello World', published: true },
          { title: 'Draft Post', published: false }
        ]
      }
    }
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob',
      posts: {
        create: { title: 'Bob\'s First Post', published: true }
      }
    }
  });

  console.log('Seeded:', { alice, bob });
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

```json
// package.json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

```bash
# Run seed
prisma db seed

# Reset and seed
prisma migrate reset  # Automatically runs seed
```

### 9. Baselining Existing Database
```bash
# For existing databases not managed by Prisma

# 1. Introspect existing schema
prisma db pull

# 2. Create baseline migration folder
mkdir -p prisma/migrations/0_init

# 3. Generate SQL for current schema
prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# 4. Mark as applied
prisma migrate resolve --applied 0_init
```

### 10. Multi-Environment Strategy
```bash
# .env.development
DATABASE_URL="postgresql://dev:dev@localhost:5432/myapp_dev"

# .env.staging  
DATABASE_URL="postgresql://stage:stage@staging-db:5432/myapp_stage"

# .env.production
DATABASE_URL="postgresql://prod:secure@prod-db:5432/myapp_prod"
```

```bash
# CI/CD Pipeline
# 1. Run migrations
npx prisma migrate deploy

# 2. Generate client
npx prisma generate

# 3. Start application
npm start
```

---

## Prerequisites
- Completed Section 21 (Prisma Migrations basics)
- Docker (for local PostgreSQL)

## Getting Started

```bash
# Start PostgreSQL
docker-compose -f docker-compose.postgres.yml up -d

# Setup demo
cd section-24-prisma-migrations-deep-dive/demo
cp .env.example .env
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
```

## Key Takeaways

- **migrate dev** is for development; **migrate deploy** is for production
- **Baseline** existing databases before adopting Prisma migrations
- **Data migrations** require careful SQL scripts for breaking changes
- **Seeding** ensures consistent test data across environments
- **Never edit** applied migration files in production
