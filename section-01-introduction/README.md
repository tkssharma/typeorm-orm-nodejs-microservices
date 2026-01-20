# Section 01: Introduction to ORMs and TypeORM

## 📚 Learning Objectives

By the end of this section, you will:

- Understand what an ORM is and why it's useful
- Know the advantages and disadvantages of using ORMs
- Understand TypeORM's architecture and design patterns
- Know when to use TypeORM vs raw SQL
- Understand Active Record vs Data Mapper patterns

---

## 📖 Lessons

### Lesson 1.1: What is an ORM?

**ORM** stands for **Object-Relational Mapping**. It's a programming technique that lets you interact with your database using your programming language's objects instead of writing raw SQL queries.

#### The Problem ORMs Solve

Without an ORM, you write code like this:

```typescript
// Raw SQL approach
const result = await pool.query('SELECT * FROM users WHERE email = $1', ['john@example.com']);
const user = result.rows[0];
```

With an ORM like TypeORM:

```typescript
// ORM approach
const user = await userRepository.findOne({
  where: { email: 'john@example.com' },
});
```

#### Key Benefits of ORMs

| Benefit                  | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| **Type Safety**          | TypeScript integration catches errors at compile time |
| **Productivity**         | Write less code, focus on business logic              |
| **Maintainability**      | Cleaner, more readable code                           |
| **Database Abstraction** | Switch databases with minimal code changes            |
| **Security**             | Built-in protection against SQL injection             |
| **Migrations**           | Version control for your database schema              |

#### The Trade-offs

| Consideration         | Details                                |
| --------------------- | -------------------------------------- |
| **Learning Curve**    | Need to learn ORM-specific syntax      |
| **Performance**       | May generate suboptimal queries        |
| **Abstraction Leaks** | Complex queries may still need raw SQL |
| **Debugging**         | Harder to debug generated SQL          |

---

### Lesson 1.2: Why TypeORM?

TypeORM is one of the most popular ORMs for TypeScript and JavaScript. Here's why:

#### TypeORM Features

1. **TypeScript First**: Built with TypeScript, full type support
2. **Decorator-Based**: Uses decorators for entity definition
3. **Multiple Databases**: PostgreSQL, MySQL, SQLite, MongoDB, and more
4. **Active Record & Data Mapper**: Supports both patterns
5. **Migrations**: Built-in migration system
6. **CLI Tools**: Command-line tools for common tasks
7. **Query Builder**: Powerful query building capabilities

#### TypeORM Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Application                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Entities   │  │ Repositories │  │ QueryBuilder │  │
│  │  (Models)    │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                           │                              │
│                           ▼                              │
│              ┌────────────────────────┐                 │
│              │      DataSource        │                 │
│              │  (Connection Manager)  │                 │
│              └────────────────────────┘                 │
│                           │                              │
│                           ▼                              │
│              ┌────────────────────────┐                 │
│              │    Database Driver     │                 │
│              │   (pg, mysql2, etc.)   │                 │
│              └────────────────────────┘                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌────────────────────────┐
                │       PostgreSQL       │
                │       Database         │
                └────────────────────────┘
```

---

### Lesson 1.3: Active Record vs Data Mapper

TypeORM supports two design patterns for working with data. Understanding these is crucial.

#### Active Record Pattern

In Active Record, the entity itself contains methods to save, remove, and find records.

```typescript
// Active Record Pattern
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;
}

// Usage
const user = new User();
user.name = 'John';
user.email = 'john@example.com';
await user.save(); // Entity saves itself

// Finding
const users = await User.find();
const user = await User.findOneBy({ id: 1 });
```

**Pros:**

- Simple and intuitive
- Less boilerplate code
- Good for small applications

**Cons:**

- Entities are tightly coupled to database logic
- Harder to test (entities depend on database connection)
- Violates Single Responsibility Principle

#### Data Mapper Pattern

In Data Mapper, entities are "dumb" objects, and repositories handle all database operations.

```typescript
// Data Mapper Pattern
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;
}

// Usage - Repository handles database operations
const userRepository = AppDataSource.getRepository(User);

const user = new User();
user.name = 'John';
user.email = 'john@example.com';
await userRepository.save(user);

// Finding
const users = await userRepository.find();
const user = await userRepository.findOneBy({ id: 1 });
```

**Pros:**

- Clean separation of concerns
- Entities are easy to test
- Better for large applications
- More flexible and maintainable

**Cons:**

- More boilerplate code
- Need to manage repositories

#### Which to Choose?

| Use Case                   | Recommended Pattern            |
| -------------------------- | ------------------------------ |
| Small projects, prototypes | Active Record                  |
| Large applications         | Data Mapper                    |
| Microservices              | Data Mapper                    |
| When testing is important  | Data Mapper                    |
| Learning TypeORM           | Either (we'll use Data Mapper) |

**This course uses the Data Mapper pattern** as it's the recommended approach for production applications.

---

### Lesson 1.4: TypeORM vs Raw SQL

When should you use TypeORM, and when should you write raw SQL?

#### Use TypeORM When:

- ✅ Building CRUD operations
- ✅ Working with relationships
- ✅ Need type safety
- ✅ Want automatic migrations
- ✅ Building standard business applications

#### Consider Raw SQL When:

- ⚠️ Complex analytical queries
- ⚠️ Database-specific features
- ⚠️ Performance-critical operations
- ⚠️ Bulk operations on millions of rows

#### TypeORM Supports Raw SQL Too!

```typescript
// You can always drop down to raw SQL
const users = await AppDataSource.query(`SELECT * FROM users WHERE created_at > $1`, [new Date('2024-01-01')]);

// Or use QueryBuilder with raw expressions
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.created_at > :date', { date: new Date('2024-01-01') })
  .andWhere('EXTRACT(YEAR FROM user.birth_date) = :year', { year: 1990 })
  .getMany();
```

---

### Lesson 1.5: TypeORM Core Concepts

Before diving into code, let's understand the key concepts:

#### 1. DataSource

The main entry point. Manages database connection and configuration.

```typescript
const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'password',
  database: 'mydb',
  entities: [User, Post],
  migrations: ['src/migrations/*.ts'],
});
```

#### 2. Entity

A class that maps to a database table.

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
```

#### 3. Repository

Provides methods to interact with entities.

```typescript
const userRepository = AppDataSource.getRepository(User);
await userRepository.find();
await userRepository.save(user);
```

#### 4. Migration

A file that describes database schema changes.

```typescript
export class CreateUserTable1234567890 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE users (...)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE users`);
  }
}
```

#### 5. QueryBuilder

A fluent API for building complex queries.

```typescript
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.isActive = :active', { active: true })
  .orderBy('user.name', 'ASC')
  .getMany();
```

---

## 🎯 Key Takeaways

1. **ORM** = Object-Relational Mapping - bridges objects and database tables
2. **TypeORM** is TypeScript-first with decorator-based entity definitions
3. **Data Mapper** pattern separates entities from database logic (recommended)
4. **Active Record** pattern has entities manage their own persistence
5. TypeORM provides **type safety**, **migrations**, and **query building**
6. You can always use **raw SQL** when needed

---

## ✅ Quiz

1. What does ORM stand for?
2. Name three benefits of using an ORM.
3. What's the main difference between Active Record and Data Mapper patterns?
4. Which pattern is recommended for large applications?
5. What is a DataSource in TypeORM?
6. When might you prefer raw SQL over TypeORM's query methods?

<details>
<summary>View Answers</summary>

1. Object-Relational Mapping
2. Type safety, productivity, maintainability, database abstraction, security, migrations (any three)
3. Active Record: entities contain database methods. Data Mapper: repositories handle database operations, entities are plain objects.
4. Data Mapper pattern
5. The main entry point that manages database connection and configuration
6. Complex analytical queries, database-specific features, performance-critical operations, bulk operations

</details>

---

## 📝 Homework

1. **Research**: Read the official TypeORM documentation introduction at https://typeorm.io/
2. **Compare**: Write a short comparison (5-10 sentences) of TypeORM vs Prisma vs Sequelize
3. **Think**: List 3 projects where you would use an ORM and 1 where you might not

---

## 📚 Further Reading

- [TypeORM Official Documentation](https://typeorm.io/)
- [TypeORM GitHub Repository](https://github.com/typeorm/typeorm)
- [Martin Fowler on Data Mapper](https://martinfowler.com/eaaCatalog/dataMapper.html)
- [Martin Fowler on Active Record](https://martinfowler.com/eaaCatalog/activeRecord.html)

---

## ➡️ Next Section

[Section 02: Project Setup and Configuration](../section-02-setup/README.md)
