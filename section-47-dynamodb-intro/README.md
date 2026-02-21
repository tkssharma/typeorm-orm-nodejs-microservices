# Section 47: Course Introduction - Amazon DynamoDB with Node.js

## Course Focus
- DynamoDB data modeling, queries, performance & production usage
- Tools: AWS DynamoDB Client (AWS SDK v3) + Nova ODM
- **Not a Node.js course** - Node.js is the tool, DynamoDB is the focus

---

## Topics Covered

### 1. Welcome to the Course
- What you will learn in this DynamoDB deep dive
- Course structure and learning path
- Prerequisites and setup requirements

### 2. What You Will Build
- Scalable NoSQL APIs with DynamoDB
- Real-world data models for common use cases
- Production-grade serverless backends

### 3. When to Use DynamoDB (and When Not To)

| ✅ Use DynamoDB When | ❌ Avoid DynamoDB When |
|---------------------|------------------------|
| Predictable access patterns | Complex ad-hoc queries needed |
| High scale (millions of requests) | Small datasets with complex joins |
| Low latency requirements | Frequent schema changes |
| Serverless architecture | Need for ACID transactions across tables |
| Key-value or document data | Heavy analytics workloads |

### 4. DynamoDB vs MongoDB vs SQL

| Feature | DynamoDB | MongoDB | SQL (PostgreSQL) |
|---------|----------|---------|------------------|
| **Model** | Key-Value / Document | Document | Relational |
| **Scaling** | Automatic, infinite | Manual sharding | Vertical + Read replicas |
| **Schema** | Schemaless | Schemaless | Strict schema |
| **Queries** | Primary key + indexes | Flexible queries | Full SQL |
| **Joins** | Not supported | $lookup (limited) | Full JOIN support |
| **Transactions** | Limited (25 items) | Full ACID | Full ACID |
| **Pricing** | Pay per request/capacity | Infrastructure | Infrastructure |
| **Best For** | Serverless, high scale | Flexible documents | Complex relationships |

### 5. Course Roadmap & Expectations
- Section 48-49: DynamoDB Fundamentals & Table Design
- Section 50: AWS SDK v3 Client
- Section 51: Nova ODM
- Section 52-53: Advanced Queries & Indexes

---

## Prerequisites
- Basic JavaScript/TypeScript knowledge
- Node.js fundamentals
- AWS Account (free tier sufficient)
- Docker (for DynamoDB Local)

---

## 🐳 DynamoDB Local Setup

```bash
# Start DynamoDB Local
docker-compose -f docker-compose.dynamodb.yml up -d
```

### Connection Details
| Setting | Value |
|---------|-------|
| **Endpoint** | `http://localhost:8000` |
| **Region** | `local` |
| **Access Key** | `local` |
| **Secret Key** | `local` |

---

## AWS Credentials Setup

```bash
# ~/.aws/credentials
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY

# Or use environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1
```

---

## Key Takeaways
- DynamoDB is purpose-built for specific access patterns
- Design starts with access patterns, not data structure
- Single-table design is powerful but requires planning
- AWS SDK v3 + Nova ODM provide excellent DX
