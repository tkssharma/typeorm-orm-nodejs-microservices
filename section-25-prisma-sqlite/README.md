# Section 25: Prisma with SQLite

## Topics Covered

### 1. Why SQLite with Prisma?
- Zero configuration database
- Perfect for prototyping and testing
- Embedded database (no server required)
- Great for desktop/mobile apps
- Lightweight CI/CD testing

### 2. SQLite Setup
```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
}
```

```env
# .env
DATABASE_URL="file:./dev.db"

# Or absolute path
DATABASE_URL="file:/Users/dev/myapp/prisma/dev.db"

# In-memory database (testing)
DATABASE_URL="file::memory:"
```

### 3. SQLite Limitations in Prisma
```prisma
// ❌ NOT SUPPORTED in SQLite

// No native UUID - use String with cuid()
model Item {
  id String @id @default(cuid())  // ✅ Works
  // id String @id @default(uuid()) // ❌ No native UUID
}

// No @db.Json - use String
model Config {
  id       Int    @id
  settings String // Store JSON as string
}

// No array types
model Tag {
  id   Int    @id
  // tags String[] // ❌ Not supported
}

// Limited ALTER TABLE (handled by Prisma automatically)
```

### 4. SQLite-Specific Features
```typescript
// WAL mode for better concurrency
// Set via PRAGMA in connection URL
DATABASE_URL="file:./dev.db?mode=rwc&_journal_mode=WAL"

// Busy timeout (wait for locks)
DATABASE_URL="file:./dev.db?_busy_timeout=5000"

// Foreign keys (enabled by default in Prisma)
DATABASE_URL="file:./dev.db?_foreign_keys=on"
```

### 5. Testing with SQLite
```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Push schema to test database
  execSync('npx prisma db push', {
    env: {
      ...process.env,
      DATABASE_URL: 'file:./test.db'
    }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean tables before each test
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
});
```

```typescript
// test/user.test.ts
import { prisma } from './setup';

describe('User', () => {
  it('should create a user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User'
      }
    });
    
    expect(user.email).toBe('test@example.com');
    expect(user.id).toBeDefined();
  });

  it('should create user with posts', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'author@example.com',
        posts: {
          create: [
            { title: 'Post 1' },
            { title: 'Post 2' }
          ]
        }
      },
      include: { posts: true }
    });
    
    expect(user.posts).toHaveLength(2);
  });
});
```

### 6. JSON Storage Pattern
```typescript
// Since SQLite doesn't support JSON type natively
// Store as string and parse

interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

// Create with JSON string
await prisma.user.create({
  data: {
    email: 'user@example.com',
    settings: JSON.stringify({
      theme: 'dark',
      notifications: true,
      language: 'en'
    })
  }
});

// Read and parse
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});
const settings: UserSettings = JSON.parse(user.settings || '{}');

// Prisma extension for automatic parsing
const xprisma = prisma.$extends({
  result: {
    user: {
      parsedSettings: {
        needs: { settings: true },
        compute(user): UserSettings {
          return JSON.parse(user.settings || '{}');
        }
      }
    }
  }
});
```

### 7. Full-Text Search in SQLite
```sql
-- Enable FTS5 extension (migration.sql)
CREATE VIRTUAL TABLE posts_fts USING fts5(
  title, 
  content,
  content='Post',
  content_rowid='id'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER posts_ai AFTER INSERT ON Post BEGIN
  INSERT INTO posts_fts(rowid, title, content) 
  VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER posts_ad AFTER DELETE ON Post BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, title, content) 
  VALUES('delete', old.id, old.title, old.content);
END;

CREATE TRIGGER posts_au AFTER UPDATE ON Post BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, title, content) 
  VALUES('delete', old.id, old.title, old.content);
  INSERT INTO posts_fts(rowid, title, content) 
  VALUES (new.id, new.title, new.content);
END;
```

```typescript
// Search using raw query
const results = await prisma.$queryRaw`
  SELECT Post.* FROM Post
  JOIN posts_fts ON Post.id = posts_fts.rowid
  WHERE posts_fts MATCH ${searchTerm}
  ORDER BY rank
  LIMIT 10
`;
```

### 8. Backup & Restore
```typescript
import { copyFileSync } from 'fs';

// Simple backup (SQLite is just a file)
function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  copyFileSync('./prisma/dev.db', `./backups/dev-${timestamp}.db`);
}

// Restore
function restoreDatabase(backupPath: string) {
  copyFileSync(backupPath, './prisma/dev.db');
}
```

---

## Prerequisites
- Completed Section 17 (Prisma Schema)
- Node.js 18+

## Getting Started

```bash
# No Docker needed for SQLite!
cd section-25-prisma-sqlite/demo
cp .env.example .env
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm dev
```

## When to Use SQLite

| Use Case | SQLite | PostgreSQL |
|----------|--------|------------|
| Prototyping | ✅ | ⚠️ |
| Unit Testing | ✅ | ⚠️ |
| Desktop Apps | ✅ | ❌ |
| Single User | ✅ | ⚠️ |
| High Concurrency | ❌ | ✅ |
| Production Web | ❌ | ✅ |
| Complex Queries | ⚠️ | ✅ |

## Key Takeaways

- **Zero setup** - SQLite is just a file
- **Great for testing** - Fast, isolated, disposable
- **Limitations** - No JSON type, no arrays, limited concurrency
- **Patterns** - Store JSON as strings, use raw SQL for FTS
- **Backup** - Just copy the database file
