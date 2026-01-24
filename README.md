# 🎓 Complete TypeORM Course with TypeScript & Node.js

> **From Beginner to Production-Ready Applications**

A comprehensive, hands-on course that takes you from zero to hero with TypeORM, TypeScript, and Node.js. Build real-world applications with PostgreSQL.

---

## 📋 Course Overview

| **Duration**      | ~40-50 hours                   |
| ----------------- | ------------------------------ |
| **Level**         | Beginner to Advanced           |
| **Prerequisites** | Basic JavaScript knowledge     |
| **Database**      | PostgreSQL                     |
| **Framework**     | Express.js (with NestJS bonus) |

---

## 🎯 What You'll Learn

By the end of this course, you will be able to:

- ✅ Understand ORMs and why TypeORM is a powerful choice
- ✅ Set up TypeORM with TypeScript and Node.js from scratch
- ✅ Design and implement database entities with decorators
- ✅ Master all relationship types (One-to-One, One-to-Many, Many-to-Many)
- ✅ Build production-ready REST APIs with Express
- ✅ Handle migrations like a pro
- ✅ Implement soft deletes, transactions, and caching
- ✅ Write testable database code
- ✅ Deploy applications with Docker
- ✅ Build a complete capstone project

---

## 📚 Course Curriculum

### **Section 01: Introduction to ORMs and TypeORM**

- What is an ORM?
- Why use TypeORM?
- TypeORM vs Raw SQL
- TypeORM Architecture Overview
- Active Record vs Data Mapper Pattern

### **Section 02: Project Setup and Configuration**

- Installing Node.js and TypeScript
- Setting up PostgreSQL
- Creating a TypeORM project from scratch
- Understanding `DataSource` configuration
- Environment variables and configuration management
- TypeORM CLI setup

### **Section 03: Entities, Columns, and Decorators**

- What are Entities?
- Column types and options
- Primary columns and generated values
- Special columns (CreateDateColumn, UpdateDateColumn, etc.)
- Column transformers
- Entity inheritance

### **Section 04: Repositories and Data Access Layer**

- Understanding Repositories
- Repository methods (find, save, update, delete)
- Custom repositories
- Repository pattern best practices
- DataSource API vs Repository API

### **Section 05: CRUD APIs with Express**

- Setting up Express with TypeORM
- Building RESTful endpoints
- Request validation
- Error handling
- Project: Building a complete CRUD API

### **Section 06: Migrations**

- Why migrations matter
- Generating migrations
- Running and reverting migrations
- Migration best practices
- Migrations in production

### **Section 07: Relationships**

- One-to-One relationships
- One-to-Many / Many-to-One relationships
- Many-to-Many relationships
- Self-referencing relationships
- Cascade operations
- Eager vs Lazy loading
- Relationship best practices

### **Section 08: QueryBuilder**

- Introduction to QueryBuilder
- SELECT queries
- INSERT, UPDATE, DELETE with QueryBuilder
- Joins and subqueries
- Raw queries
- When to use QueryBuilder vs Repository

### **Section 09: Soft Deletes and Paranoid Tables**

- What is soft delete?
- Implementing soft deletes
- Querying soft-deleted records
- Restoring deleted records
- Best practices

### **Section 10: Database Seeding**

- Why seed data?
- Creating seed scripts
- Using factories for test data
- Seeding in different environments

### **Section 11: Transactions**

- Understanding transactions
- Transaction isolation levels
- Implementing transactions in TypeORM
- Nested transactions
- Error handling in transactions

### **Section 12: Performance Tuning**

- Database indexing
- Query optimization
- Relation loading strategies
- Caching with TypeORM
- Connection pooling
- Logging and debugging

### **Section 13: Advanced Topics**

- Entity subscribers and event listeners
- Embeddable entities
- Custom repositories (advanced)
- DTO validation with class-validator
- Multi-database connections

### **Section 14: Testing Database Code**

- Unit testing repositories
- Integration testing with test database
- Mocking TypeORM
- E2E testing strategies
- Test fixtures and factories

### **Section 15: Capstone Project - Employee Management System**

- Project requirements
- Database design
- Implementation step-by-step
- Authentication and authorization
- Complete API documentation

### **Section 16: Deployment with Docker**

- Dockerizing your application
- Docker Compose for development
- Environment configuration
- Production deployment checklist
- CI/CD considerations

### **Bonus Section: Comparisons and Advanced Patterns**

- TypeORM vs Sequelize vs Prisma
- TypeORM v0.3+ syntax changes
- Multi-tenant architecture
- Migrations in CI/CD pipelines
- Repository vs DataSource APIs

---

## 🗂️ Course Structure

```
typeorm-course/
├── README.md                          # This file
├── CHEATSHEET.md                      # Quick reference guide
├── section-01-introduction/           # Introduction to ORMs
├── section-02-setup/                  # Project setup
├── section-03-entities/               # Entities and decorators
├── section-04-repositories/           # Repository pattern
├── section-05-crud-express/           # CRUD with Express
├── section-06-migrations/             # Database migrations
├── section-07-relationships/          # All relationship types
├── section-08-querybuilder/           # QueryBuilder deep dive
├── section-09-soft-deletes/           # Soft delete pattern
├── section-10-seeding/                # Database seeding
├── section-11-transactions/           # Transaction management
├── section-12-performance/            # Performance optimization
├── section-13-advanced/               # Advanced topics
├── section-14-testing/                # Testing strategies
├── section-15-capstone/               # Final project
├── section-16-deployment/             # Docker deployment
├── bonus-section/                     # Comparisons and extras
└── examples/                          # Complete example applications
    ├── express-typeorm-blog-app/      # Express + TypeORM Blog (migrations, relationships, transactions)
    └── nestjs-typeorm-app/            # NestJS + TypeORM Blog
```

---

## 🚀 Complete Example Applications

### Express + TypeScript + TypeORM Blog App

A comprehensive blog application demonstrating all TypeORM fundamentals:

- **Entities**: Author, Post, Comment with relationships
- **Migrations**: Complete migration setup with up/down methods
- **Transactions**: Atomic operations for complex business logic
- **Soft Deletes**: Post entity with soft delete support
- **Query Builder**: Advanced queries in services

```bash
cd examples/express-typeorm-blog-app
npm install
cp .env.example .env
npm run migration:run
npm run dev
```

### NestJS + TypeORM Blog App

The same blog application built with NestJS framework:

- **Module-based architecture**: Users, Posts, Comments modules
- **Dependency Injection**: Repository injection with @InjectRepository
- **DTO Validation**: Request validation with class-validator
- **Best Practices**: Production-ready NestJS patterns

```bash
cd examples/nestjs-typeorm-app
npm install
cp .env.example .env
npm run migration:run
npm run start:dev
```

---

## 🛠️ Tech Stack

| Technology | Version | Purpose          |
| ---------- | ------- | ---------------- |
| Node.js    | 18+     | Runtime          |
| TypeScript | 5.x     | Language         |
| TypeORM    | 0.3.x   | ORM              |
| PostgreSQL | 15+     | Database         |
| Express    | 4.x     | Web Framework    |
| Jest       | 29.x    | Testing          |
| Docker     | Latest  | Containerization |

---

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v18 or higher)

   ```bash
   node --version
   ```

2. **PostgreSQL** (v15 or higher)

   ```bash
   psql --version
   ```

3. **npm or yarn**
   ```bash
   npm --version
   ```

### Quick Start

```bash
# Clone or navigate to the course folder
cd typeorm-course

# Each section has its own project
cd section-02-setup/demo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run the project
npm run dev
```

---

## 📖 How to Use This Course

1. **Follow in order**: Each section builds on the previous one
2. **Type the code**: Don't just copy-paste; type it out for better learning
3. **Complete assignments**: Each section has homework tasks
4. **Build the capstone**: Apply everything you've learned
5. **Reference the cheatsheet**: Use it as a quick lookup

---

## 🎁 Bonus Materials

- 📋 TypeORM Cheatsheet
- 🔍 Common Mistakes Guide
- ✅ Production Checklist
- 🏗️ Architecture Diagrams
- 📚 Additional Resources

---

## 📚 Official Resources

- [TypeORM Documentation](https://typeorm.io/)
- [TypeORM GitHub](https://github.com/typeorm/typeorm)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express Documentation](https://expressjs.com/)

---

## 👨‍💻 Author

This course is designed to be practical, hands-on, and production-focused. Every concept is explained with real-world examples and best practices.

---

## 📄 License

This course material is provided for educational purposes.

---

**Happy Learning! 🚀**
