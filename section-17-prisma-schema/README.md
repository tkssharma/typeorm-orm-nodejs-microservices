# Section 17: Prisma Schema & Data Modeling

## Topics Covered

### 1. Prisma Schema File Explained
- `schema.prisma` structure
- Generator configuration
- Datasource configuration
- Comments and documentation

### 2. Models, Fields & Data Types
- Defining models
- Scalar types (String, Int, Float, Boolean, DateTime, etc.)
- Optional vs required fields
- Field mapping with `@map`
- Table mapping with `@@map`

### 3. Primary Keys, UUIDs & Auto-Increment
- `@id` attribute
- Auto-increment with `@default(autoincrement())`
- UUID with `@default(uuid())`
- CUID with `@default(cuid())`
- Composite primary keys with `@@id`

### 4. Enums in Prisma
- Defining enums
- Using enums in models
- Enum mapping to database
- TypeScript enum integration

### 5. Default Values & Field Attributes
- `@default()` function
- `now()` for timestamps
- `@updatedAt` for auto-update
- Database functions in defaults

### 6. Indexes & Unique Constraints
- `@unique` for single field
- `@@unique` for composite unique
- `@@index` for performance
- Index types and options

## Example Schema
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}
```

## Getting Started
```bash
cd section-17-prisma-schema/demo
pnpm install
pnpm prisma format
pnpm prisma generate
```
