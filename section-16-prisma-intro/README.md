# Section 16: Prisma ORM - Introduction & Setup

## Topics Covered

### 1. What is Prisma ORM & Why Use It?

- Overview of Prisma as a next-generation ORM
- Type-safe database access
- Auto-generated queries
- Benefits over traditional ORMs

### 2. Prisma vs TypeORM vs Sequelize (Quick Comparison)

- Feature comparison
- Performance considerations
- Developer experience
- When to use which ORM

### 3. Prisma Architecture (Client, Engine, Schema)

- Prisma Client - Type-safe query builder
- Prisma Engine - Query execution
- Prisma Schema - Data modeling language
- How components work together

### 4. Setting Up Prisma with Node.js

- Installing Prisma CLI
- Initializing Prisma in a project
- Configuring database connection
- Environment variables setup

### 5. Prisma + TypeScript Setup (Best Practices)

- TypeScript configuration
- Strict mode settings
- Type generation
- Project structure recommendations

### 6. Prisma CLI Deep Dive

- `prisma init` - Initialize Prisma
- `prisma generate` - Generate Prisma Client
- `prisma db push` - Push schema to database
- `prisma migrate` - Database migrations
- `prisma studio` - Visual database editor
- `prisma format` - Format schema file

## Prerequisites

- Node.js 18+
- TypeScript basics
- Basic SQL knowledge
- Docker (for local PostgreSQL)

---

## 🐳 Docker-Based PostgreSQL Setup

All Prisma demos in this course use a **Docker-based PostgreSQL** instance for consistency.

### Start PostgreSQL with Docker

```bash
# From project root
docker-compose -f docker-compose.postgres.yml up -d
```

### Connection Details

| Property          | Value                        |
| ----------------- | ---------------------------- |
| **Host**          | localhost                    |
| **Port**          | 5432                         |
| **User**          | postgres                     |
| **Password**      | postgres123                  |
| **Database**      | course_db                    |
| **pgAdmin URL**   | http://localhost:5050        |
| **pgAdmin Login** | admin@example.com / admin123 |

### Prisma DATABASE_URL

Use this connection string in your `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/course_db?schema=public"
```

### Docker Commands

```bash
# Start containers
docker-compose -f docker-compose.postgres.yml up -d

# Stop containers
docker-compose -f docker-compose.postgres.yml down

# View logs
docker logs postgres-course

# Connect via psql
docker exec -it postgres-course psql -U postgres -d course_db

# Reset database (delete all data)
docker-compose -f docker-compose.postgres.yml down -v
docker-compose -f docker-compose.postgres.yml up -d
```

### Verify Connection

```bash
# Test connection
docker exec -it postgres-course psql -U postgres -d course_db -c "SELECT version();"
```

---

## Getting Started

```bash
# 1. Start PostgreSQL
docker-compose -f docker-compose.postgres.yml up -d

# 2. Setup demo
cd section-16-prisma-intro/demo
cp .env.example .env
pnpm install
pnpm prisma generate
pnpm prisma db push
```
