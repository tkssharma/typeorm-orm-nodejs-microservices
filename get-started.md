# Demo Projects Guide

This course includes progressive demo projects that build upon each other. Each section's demo focuses on specific concepts while reusing the same base structure.

## 🚀 Quick Start

For any demo project:

```bash
cd section-XX-name/demo
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm run dev
```

---

## 📁 Demo Projects Overview

### Section 02: Setup Demo

**Focus:** Basic TypeORM setup and CRUD operations

```
section-02-setup/demo/
├── src/
│   ├── entities/User.ts      # Basic User entity
│   ├── data-source.ts        # DataSource configuration
│   └── index.ts              # Basic CRUD demo
```

**What you'll learn:**

- DataSource configuration
- Basic entity definition
- Create, Read, Update, Delete operations

---

### Section 03: Entities Demo

**Focus:** Entity decorators, column types, and advanced entity features

```
section-03-entities/demo/
├── src/
│   ├── entities/
│   │   ├── User.ts           # User with enums, special columns
│   │   ├── Product.ts        # Product with array columns
│   │   └── Company.ts        # Embedded entities (Address)
│   └── index.ts              # Entity features demo
```

**What you'll learn:**

- Column types and options
- Enums and special columns
- Embedded entities

---

### Section 04: Repositories Demo

**Focus:** Custom repositories and advanced find operations

```
section-04-repositories/demo/
├── src/
│   ├── entities/User.ts
│   ├── repositories/
│   │   └── UserRepository.ts  # Custom repository methods
│   └── index.ts               # Repository pattern demo
```

**What you'll learn:**

- Custom repository methods
- Pagination
- Search functionality
- Repository pattern

---

### Section 05: CRUD Express Demo

**Focus:** Complete REST API with Express

```
section-05-crud-express/demo/
├── src/
│   ├── entities/User.ts
│   ├── dto/user.dto.ts        # DTOs with validation
│   ├── services/userService.ts
│   ├── controllers/userController.ts
│   ├── routes/userRoutes.ts
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── validateRequest.ts
│   ├── app.ts
│   └── index.ts
```

**What you'll learn:**

- Layered architecture
- DTO validation with class-validator
- Error handling middleware
- RESTful API design

---

### Section 07: Relationships Demo

**Focus:** All relationship types

```
section-07-relationships/demo/
├── src/
│   ├── entities/
│   │   ├── User.ts            # One-to-One, One-to-Many
│   │   ├── Profile.ts         # One-to-One (owning side)
│   │   ├── Post.ts            # Many-to-One, Many-to-Many
│   │   └── Tag.ts             # Many-to-Many
│   └── index.ts               # Relationships demo
```

**What you'll learn:**

- One-to-One relationships
- One-to-Many / Many-to-One
- Many-to-Many with JoinTable
- Loading relations

---

### Section 08: QueryBuilder Demo

**Focus:** Advanced queries with QueryBuilder

```
section-08-querybuilder/demo/
├── src/
│   ├── entities/
│   │   ├── User.ts
│   │   └── Post.ts
│   └── index.ts               # QueryBuilder examples
```

**What you'll learn:**

- SELECT with conditions
- Complex WHERE with Brackets
- JOINs and aggregations
- Pagination and subqueries

---

### Section 11: Transactions Demo

**Focus:** Database transactions

```
section-11-transactions/demo/
├── src/
│   ├── entities/
│   │   ├── Account.ts         # Bank account entity
│   │   └── TransactionLog.ts  # Transaction logging
│   └── index.ts               # Transaction examples
```

**What you'll learn:**

- transaction() method
- QueryRunner for manual control
- Commit and rollback
- Error handling in transactions

---

## 🔄 Progression Path

```
Section 02 (Setup)
    ↓ Basic CRUD
Section 03 (Entities)
    ↓ Advanced entities
Section 04 (Repositories)
    ↓ Custom repositories
Section 05 (Express)
    ↓ Full API
Section 07 (Relationships)
    ↓ Entity relations
Section 08 (QueryBuilder)
    ↓ Complex queries
Section 11 (Transactions)
    ↓ Data integrity
```

---

## 🗄️ Database Setup

All demos use the same PostgreSQL database:

```bash
# Create database
psql -U postgres -c "CREATE DATABASE typeorm_course;"

# Or with Docker
docker run -d \
  --name typeorm-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=typeorm_course \
  -p 5432:5432 \
  postgres:15
```

---

## 📝 Environment Variables

Each demo uses the same `.env` structure:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=typeorm_course
NODE_ENV=development
```

---

## 🧪 Running Demos

```bash
# Run any demo
cd section-XX-name/demo
npm install
npm run dev

# Build for production
npm run build
npm start
```

---

## ⚠️ Note on Lint Errors

When you first open demo files in your IDE, you may see lint errors like:

- "Cannot find module 'typeorm'"
- "Cannot find module 'express'"

**These are expected!** They resolve after running `npm install` in the demo directory.
