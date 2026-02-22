# MongoDB Mastery - Node.js & Mongoose

## Course Overview

Master MongoDB with Node.js - from fundamentals to production-ready applications. This hands-on course covers MongoDB driver, Mongoose ODM, schema design, aggregations, and real-world patterns.

---

## Part 1: MongoDB Fundamentals (Sections 30-33)

### Section 30: Course Introduction

- Welcome & Course Goals
- What You Will Build
- How MongoDB Fits in Modern Backends
- Tools & Setup (Node.js, MongoDB, Compass)
- Docker-based MongoDB setup

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

---

## Part 2: Schema Design & Queries (Sections 34-37)

### Section 34: Schema Design & Data Modeling

- Designing Schemas for Real Apps
- Embedded vs Referenced Documents
- One-to-One, One-to-Many, Many-to-Many Relationships
- Handling Large Collections
- Schema design patterns

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

---

## Part 3: Advanced Patterns (Sections 38-42)

### Section 38: Authentication Data Modeling

- User Schema Design
- Password Hashing with bcrypt
- Storing Tokens Securely
- Session vs Token-Based Auth
- MongoDB for Auth Systems
- Refresh token patterns

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
- Mongoose middleware for auditing

### Section 42: Security Best Practices

- Preventing NoSQL Injection
- Secure Connection Strings
- Role-Based Database Access
- Data Encryption at Rest & Transit

---

## Part 4: Production & Real-World (Sections 43-46)

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

## Technologies Covered

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **ODM**: Mongoose
- **Database**: MongoDB
- **Frameworks**: Express.js
- **Tools**: Docker, MongoDB Compass, MongoDB Atlas

## Who Should Join This Course

👨‍💻 **Backend Developers** - Master NoSQL database operations

👩‍💻 **Full-Stack Developers** - Add MongoDB to your toolkit

🎓 **Students & Beginners** - Learn document databases

💼 **Job Seekers** - Prepare for Node.js backend interviews

🔄 **SQL Developers** - Transition to NoSQL patterns

📈 **Team Leads** - Evaluate MongoDB for your projects

### Prerequisites

- Basic JavaScript/TypeScript knowledge
- Familiarity with Node.js fundamentals
- Understanding of basic database concepts
- No prior MongoDB experience needed!

---

## What You Will Learn

### Core Skills

- ✅ Set up and configure MongoDB with Node.js
- ✅ Design document schemas with Mongoose
- ✅ Perform CRUD operations with type safety
- ✅ Model relationships (embedded and referenced)
- ✅ Write advanced aggregation pipelines
- ✅ Optimize queries with proper indexing
- ✅ Handle transactions for data integrity
- ✅ Secure your MongoDB applications

### Practical Applications

- 🚀 Build REST APIs with Express.js + Mongoose
- 🚀 Implement user authentication with MongoDB
- 🚀 Design e-commerce data models
- 🚀 Create analytics dashboards with aggregations
- 🚀 Deploy to MongoDB Atlas

### Professional Skills

- 💼 Choose between SQL and NoSQL
- 💼 Debug database issues and optimize queries
- 💼 Write clean, maintainable data access code
- 💼 Follow production deployment best practices

---

## Course Highlights

- Master MongoDB with Mongoose ODM
- Build real-world projects
- TypeScript integration for type safety
- Aggregation pipelines and complex queries
- REST APIs with Express.js
- Schema design patterns
- Production-ready patterns and best practices
- Hands-on demos with downloadable source code

---

## Estimated Course Length

| Part                | Section        | Duration      |
| ------------------- | -------------- | ------------- |
| **Fundamentals**    | Sections 30-33 | 3-4 hours     |
| **Schema & Queries**| Sections 34-37 | 3-4 hours     |
| **Advanced**        | Sections 38-42 | 4-5 hours     |
| **Production**      | Sections 43-46 | 2-3 hours     |
| **Total**           |                | **12-15 hours** |

---

## Demo Projects Included

Each section includes working demo projects:

```
section-XX-*/
├── README.md          # Topics and learning objectives
└── demo/
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    └── src/
        ├── models/
        └── index.ts
```

### Docker MongoDB Setup

```bash
# Start MongoDB with Docker
docker-compose -f docker-compose.mongodb.yml up -d

# Connection URL
MONGODB_URI="mongodb://admin:admin123@localhost:27017/course_db?authSource=admin"

# Access MongoDB Express UI
http://localhost:8081
```

### Running Demos

```bash
cd section-XX/demo
cp .env.example .env
pnpm install
pnpm dev
```

---

## Section Details

| Section | Topic | Key Concepts |
|---------|-------|--------------|
| 30 | Introduction | Setup, Tools, Overview |
| 31 | Fundamentals | Documents, BSON, CRUD |
| 32 | Node.js Driver | Connection, Error Handling |
| 33 | Mongoose | Schemas, Models, Queries |
| 34 | Schema Design | Embedded vs Referenced |
| 35 | Advanced Queries | Aggregation, $lookup, Text Search |
| 36 | Indexing | Performance, Compound Indexes |
| 37 | Validation | Custom Validators, Rules |
| 38 | Auth Modeling | Users, Passwords, Tokens |
| 39 | Transactions | ACID, Multi-Document |
| 40 | Aggregation | Pipeline, $group, $facet |
| 41 | Soft Deletes | Auditing, Versioning |
| 42 | Security | Injection, Encryption |
| 43 | Scaling | Pooling, Replica Sets |
| 44 | Production | Atlas, Backup, Monitoring |
| 45 | Real-World | E-Commerce API |
| 46 | Interview Prep | Common Mistakes, Questions |

---

## MongoDB vs SQL Quick Reference

| Concept | SQL | MongoDB |
|---------|-----|---------|
| Database | Database | Database |
| Table | Table | Collection |
| Row | Row | Document |
| Column | Column | Field |
| Primary Key | PRIMARY KEY | _id |
| Foreign Key | FOREIGN KEY | Reference ($ref) |
| JOIN | JOIN | $lookup / populate |
| Index | INDEX | Index |

---

## Mongoose Schema Example

```typescript
import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
  name: string;
  email: string;
  posts: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', userSchema);
```
