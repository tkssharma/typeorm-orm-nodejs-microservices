# Node.js ORM Mastery - TypeORM & Prisma

## Course Overview

Master database operations in Node.js with TypeORM and Prisma - the two most popular ORMs in the ecosystem. This hands-on course takes you from fundamentals to advanced patterns with real-world demos.

---

## Part 1: TypeORM (Sections 01-15)

### Section 01: Introduction to ORMs and TypeORM

- What is an ORM and why use it?
- TypeORM features and architecture
- Active Record vs Data Mapper patterns
- TypeORM vs raw SQL - when to use which
- Core concepts: DataSource, Entity, Repository, Migration, QueryBuilder

### Section 02: Project Setup and Configuration

- Node.js + TypeScript project setup
- Installing TypeORM and PostgreSQL driver
- DataSource configuration options
- Environment variables and .env setup
- Graceful shutdown handling
- Express.js integration basics

### Section 03: Entities, Columns, and Decorators

- Creating entities with @Entity decorator
- Column types (varchar, text, int, decimal, boolean, json, uuid, arrays)
- Column options (nullable, unique, default, select, length)
- Primary columns (@PrimaryGeneratedColumn, @PrimaryColumn, composite keys)
- Special columns (@CreateDateColumn, @UpdateDateColumn, @DeleteDateColumn, @VersionColumn)
- Enum columns with TypeScript enums
- Column transformers for data modification
- Entity inheritance (Single Table, Concrete Table, Embedded Entities)

### Section 04: Repositories and Data Access

- Repository pattern in TypeORM
- Built-in repository methods (find, findOne, save, remove, count)
- Custom repositories
- Repository vs EntityManager
- Query options (where, order, relations, select, skip, take)

### Section 05: CRUD Operations with Express

- Building REST APIs with Express + TypeORM
- Create, Read, Update, Delete operations
- Error handling and validation
- Request/Response patterns
- Middleware integration

### Section 06: TypeORM CLI

- CLI setup and configuration
- Migration commands (create, generate, run, revert, show)
- Schema commands (sync, drop, log)
- Entity generation
- Cache management
- Best practices for migrations

### Section 07: Relationships

- One-to-One relationships (@OneToOne, @JoinColumn)
- One-to-Many / Many-to-One relationships
- Many-to-Many relationships (@ManyToMany, @JoinTable)
- Bi-directional vs uni-directional relations
- Eager vs lazy loading
- Cascade operations
- Self-referencing relationships

### Section 08: QueryBuilder

- Creating queries with QueryBuilder
- SELECT, WHERE, ORDER BY, GROUP BY
- Joins (inner, left, right)
- Subqueries
- Raw SQL expressions
- Pagination with skip/take
- Complex filtering and conditions

### Section 09: Soft Deletes

- Implementing soft delete pattern
- @DeleteDateColumn usage
- Querying soft-deleted records
- Restoring deleted records

### Section 10: Framework Integration

- TypeORM with Express.js (full API)
- TypeORM with NestJS (@nestjs/typeorm)
- Node.js + TypeScript best practices
- Database seeding strategies

### Section 11: Transactions

- Understanding database transactions
- Transaction methods in TypeORM
- queryRunner transactions
- @Transaction decorator
- Error handling in transactions
- Isolation levels

### Section 12: Performance Optimization

- Query optimization techniques
- Indexing strategies
- Connection pooling
- Lazy vs eager loading trade-offs
- N+1 query problem solutions

### Section 13: Advanced Patterns

- Custom naming strategies
- Subscribers and listeners
- Entity lifecycle hooks
- Database views
- Raw queries

### Section 14: Testing

- Unit testing repositories
- Integration testing with test database
- Mocking TypeORM
- Test fixtures and factories

### Section 15: Deployment

- Production configuration
- Environment-based settings
- SSL connections
- Migration strategies for production

---

## Part 2: Prisma ORM (Sections 16-22)

### Section 16: Prisma Introduction & Setup

- What is Prisma and why use it?
- Prisma vs TypeORM comparison
- Prisma architecture (Client, Engine, Schema)
- Setting up Prisma with Node.js + TypeScript
- Prisma CLI commands (init, generate, db push, migrate, studio, format)

### Section 17: Prisma Schema & Data Modeling

- Schema file structure (datasource, generator, model)
- Field types and modifiers
- Default values and auto-generation
- Enums in Prisma
- Indexes and constraints (@id, @unique, @@index, @@unique)
- Field attributes (@default, @map, @relation, @updatedAt)

### Section 18: Prisma Relations

- One-to-One relations
- One-to-Many relations
- Many-to-Many relations (implicit and explicit)
- Self-relations
- Relation fields and foreign keys
- Referential actions (onDelete, onUpdate)

### Section 19: Prisma Client & CRUD Operations

- Generating and using Prisma Client
- Create operations (create, createMany)
- Read operations (findUnique, findFirst, findMany)
- Update operations (update, updateMany, upsert)
- Delete operations (delete, deleteMany)
- Filtering, sorting, and pagination
- Select and include for field selection

### Section 20: Prisma Advanced Queries

- Aggregations (count, sum, avg, min, max)
- Grouping with groupBy
- Nested writes and transactions
- Raw SQL queries ($queryRaw, $executeRaw)
- Complex filtering (AND, OR, NOT, contains, startsWith)
- Cursor-based pagination

### Section 21: Prisma Migrations

- Creating migrations (prisma migrate dev)
- Applying migrations (prisma migrate deploy)
- Migration history and rollback
- Database seeding with prisma db seed
- Prisma Studio for visual editing
- Schema introspection (prisma db pull)

### Section 22: Prisma with Backend Frameworks

- Prisma + Express.js REST API
- Prisma Client singleton pattern
- Error handling
- Request validation
- API route organization
- Production considerations

---

## Part 3: MongoDB with Node.js (Sections 30-46)

### Section 30: Course Introduction

- Welcome & Course Goals
- What You Will Build
- How MongoDB Fits in Modern Backends
- Tools & Setup (Node.js, MongoDB, Compass)

### Section 31: MongoDB Fundamentals

- What is MongoDB & NoSQL
- MongoDB vs SQL (Quick Comparison)
- Documents, Collections & BSON
- MongoDB Atlas Overview
- Using MongoDB Compass
- Basic CRUD Operations

### Section 32: Connecting MongoDB with Node.js

- MongoDB Node.js Driver
- Connection Strings & Environment Variables
- Handling Connection Errors
- Project Structure for MongoDB APIs

### Section 33: Mongoose Essentials

- Why Mongoose (ODM benefits)
- Defining Schemas & Models
- Data Types & Validation
- Default Values & Timestamps
- CRUD Operations using Mongoose
- Query Helpers

### Section 34: Schema Design & Data Modeling

- Designing Schemas for Real Apps
- Embedded vs Referenced Documents
- One-to-One, One-to-Many, Many-to-Many Relationships
- Handling Large Collections

### Section 35: Advanced MongoDB Queries

- Filtering & Projections
- Sorting & Pagination
- Population & Joins ($lookup)
- Aggregation Framework
- Text Search & Geospatial Queries

### Section 36: Indexing & Performance

- How Indexes Work
- Single Field & Compound Indexes
- Unique & Text Indexes
- Query Performance Analysis
- When Indexes Hurt Performance

### Section 37: Validation & Data Integrity

- Mongoose vs MongoDB Validation
- Custom Validators
- Schema-Level vs Database-Level Rules
- Handling Invalid Data Safely

### Section 38: Authentication Data Modeling

- User Schema Design
- Password Hashing
- Storing Tokens Securely
- Session vs Token-Based Auth
- MongoDB for Auth Systems

### Section 39: Transactions & Consistency

- What are Transactions in MongoDB
- Multi-Document Transactions
- ACID in MongoDB
- When to Use Transactions
- Performance Tradeoffs

### Section 40: MongoDB Aggregation Mastery

- Aggregation Pipeline Deep Dive
- $match, $group, $project
- $lookup with Real Data
- $unwind & $facet
- Analytics & Reporting Queries

### Section 41: Soft Deletes, Auditing & Versioning

- Soft Delete Patterns
- Audit Fields (createdBy, updatedBy)
- Versioning Documents
- Data Recovery Strategies

### Section 42: Security Best Practices

- Preventing NoSQL Injection
- Secure Connection Strings
- Role-Based Database Access
- Data Encryption at Rest & Transit

### Section 43: Scaling MongoDB Applications

- Connection Pooling
- MongoDB Atlas Scaling
- Replica Sets Explained
- Sharding Basics
- Handling High-Traffic APIs

### Section 44: Production Setup

- Environment-Based Configs
- MongoDB Atlas in Production
- Backup & Restore
- Monitoring Queries & Performance

### Section 45: Real-World MongoDB Project

- Production-grade E-Commerce API
- Advanced schema design
- Complex aggregations
- Indexing & performance tuning
- Transactions & secure data handling

### Section 46: Common Mistakes & Interview Prep

- MongoDB Design Mistakes
- Performance Pitfalls
- Real MongoDB Interview Questions
- How Companies Use MongoDB

---

## Part 4: Amazon DynamoDB (Sections 47-53)

### Section 47: Course Introduction - DynamoDB

- Welcome to DynamoDB Course
- What You Will Build
- When to Use DynamoDB (and When Not To)
- DynamoDB vs MongoDB vs SQL
- Course Roadmap & Expectations

### Section 48: DynamoDB Fundamentals (Core Focus)

- What is DynamoDB
- Fully Managed NoSQL Explained
- Tables, Items & Attributes
- Primary Keys: Partition Key & Sort Key
- Data Types in DynamoDB
- Strong vs Eventual Consistency

### Section 49: DynamoDB Table Design Basics

- Access Pattern–Driven Design
- Designing with Queries in Mind
- Hot Partitions Explained
- Choosing Partition Keys
- Sort Keys for Range Queries
- Single Table vs Multi Table Design

### Section 50: AWS DynamoDB Client (AWS SDK v3)

- AWS SDK v3 Overview
- Setting Up Credentials Securely
- DynamoDBClient vs DynamoDBDocumentClient
- PutItem, GetItem, UpdateItem, DeleteItem
- Query vs Scan (Critical Difference)
- Handling Pagination
- Error Handling Best Practices

### Section 51: Nova ODM Essentials

- What is Nova ODM and Why Use It
- Defining Models & Schemas
- Attribute Types & Defaults
- CRUD Operations with Nova
- Querying Data with Nova
- Model-Level Validation

### Section 52: Advanced Query Patterns

- Querying with Partition + Sort Keys
- Begins_with & Between Queries
- Conditional Writes
- Filtering vs Key Conditions
- Efficient Pagination
- Atomic Updates & Counters
- Avoiding Scans

### Section 53: Secondary Indexes (GSIs & LSIs)

- Why Secondary Indexes Exist
- Global Secondary Indexes (GSI)
- Local Secondary Indexes (LSI)
- Designing GSIs for New Access Patterns
- GSI Performance & Cost Tradeoffs
- Sparse Index Pattern
- Overloaded GSI Pattern

---

## Technologies Covered

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **ORMs/ODMs**: TypeORM, Prisma, Mongoose, Nova ODM
- **Databases**: PostgreSQL, MongoDB, Amazon DynamoDB
- **Frameworks**: Express.js, NestJS
- **Cloud**: AWS SDK v3, DynamoDB Local
- **Tools**: Docker, pnpm, Prisma Studio, MongoDB Compass, MongoDB Atlas, DynamoDB Admin

## Who Should Join This Course

👨‍💻 **Backend Developers** - Master database operations in Node.js

👩‍💻 **Full-Stack Developers** - Strengthen backend skills with production patterns

🎓 **Students & Beginners** - Comprehensive introduction to ORMs

💼 **Job Seekers** - Prepare for Node.js backend interviews

🔄 **Developers Switching Stacks** - Coming from other languages to Node.js

📈 **Team Leads** - Evaluate and choose ORMs for projects

### Prerequisites

- Basic JavaScript/TypeScript knowledge
- Familiarity with Node.js fundamentals
- Understanding of basic SQL concepts (helpful but not required)
- No prior ORM experience needed!

---

## What You Will Learn

### Core Skills

- ✅ Set up and configure TypeORM and Prisma in Node.js projects
- ✅ Design database schemas using code-first and schema-first approaches
- ✅ Perform CRUD operations with type-safe queries
- ✅ Model complex relationships (One-to-One, One-to-Many, Many-to-Many)
- ✅ Write advanced queries using QueryBuilder and raw SQL
- ✅ Manage database migrations for safe schema evolution
- ✅ Handle transactions for data integrity
- ✅ Optimize performance with indexing and connection pooling

### Practical Applications

- 🚀 Build REST APIs with Express.js + TypeORM/Prisma
- 🚀 Create NestJS applications with @nestjs/typeorm
- 🚀 Implement user authentication with relations
- 🚀 Design e-commerce data models
- 🚀 Use CLI tools for migrations and schema management

### Professional Skills

- 💼 Choose the right ORM for your project
- 💼 Debug database issues and optimize queries
- 💼 Write clean, maintainable data access code
- 💼 Follow production deployment best practices

---

## Course Highlights

- Master TypeORM and Prisma - the two most popular Node.js ORMs
- Build real-world projects with PostgreSQL
- TypeScript integration for type-safe database operations
- Migrations, transactions, and relationship modeling
- REST APIs with Express.js and NestJS
- Compare ORMs to make informed technology choices
- Production-ready patterns and best practices
- Hands-on demos with downloadable source code

---

## Estimated Course Length

| Part         | Section        | Duration        |
| ------------ | -------------- | --------------- |
| **TypeORM**  | Sections 01-15 | 10-12 hours     |
| **Prisma**   | Sections 16-22 | 6-8 hours       |
| **MongoDB**  | Sections 30-46 | 12-15 hours     |
| **DynamoDB** | Sections 47-53 | 6-8 hours       |
| **Total**    |                | **34-43 hours** |

---

## Demo Projects Included

Each section includes working demo projects:

```
section-XX/
├── README.md          # Topics and learning objectives
└── demo/
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── prisma/          # (Prisma sections)
    │   └── schema.prisma
    └── src/
        ├── data-source.ts  # (TypeORM sections)
        ├── entities/
        └── index.ts
```

### Running Demos

```bash
cd section-XX/demo
cp .env.example .env
pnpm install
pnpm dev
```
