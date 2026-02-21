# Section 49: DynamoDB Table Design Basics

## Core Principle
> **Design for access patterns, NOT for data structure**

---

## Topics Covered

### 1. Access Pattern–Driven Design

```
Traditional SQL Approach:
1. Define entities
2. Normalize data
3. Create tables
4. Write queries later

DynamoDB Approach:
1. List ALL access patterns
2. Design keys to support patterns
3. Create table structure
4. Queries are predetermined
```

#### Example: E-commerce Access Patterns
```
1. Get user profile by userId
2. Get all orders for a user
3. Get order by orderId
4. Get all orders by date range
5. Get order items for an order
6. Get all orders with status "pending"
```

### 2. Designing with Queries in Mind

| Access Pattern | PK | SK | Index |
|---------------|----|----|-------|
| Get user by ID | `USER#<id>` | `PROFILE` | - |
| Get user orders | `USER#<id>` | `ORDER#<date>` | - |
| Get order by ID | `ORDER#<id>` | `ORDER#<id>` | GSI1 |
| Orders by status | `STATUS#<status>` | `ORDER#<date>` | GSI2 |

### 3. Hot Partitions Explained

```
❌ BAD: Hot Partition
┌──────────────────────────────────────┐
│ PK: "ORDERS"                          │ ← All writes go here!
│ Items: 10,000,000                     │
└──────────────────────────────────────┘

✅ GOOD: Distributed
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PK: USER#001 │ │ PK: USER#002 │ │ PK: USER#003 │
│ Items: 100   │ │ Items: 150   │ │ Items: 80    │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Causes of Hot Partitions:**
- Using same PK for all items
- Time-based keys (all today's data in one partition)
- Popular items getting most traffic

### 4. Choosing Partition Keys

| ✅ Good Partition Keys | ❌ Bad Partition Keys |
|-----------------------|----------------------|
| `userId` | `status` (few values) |
| `orderId` | `country` (uneven distribution) |
| `deviceId` | `date` (all today = hot) |
| `transactionId` | `type` (limited values) |

**High Cardinality Rule:** Choose keys with many unique values

### 5. Sort Keys for Range Queries

```typescript
// PK: USER#123
// SK patterns for different data:

SK: "PROFILE"                    // User profile
SK: "ORDER#2024-01-15#001"       // Order with date
SK: "ORDER#2024-01-16#002"       // Another order
SK: "PAYMENT#2024-01-15#001"     // Payment record

// Query: Get all orders for user
KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)"
ExpressionAttributeValues: {
  ":pk": "USER#123",
  ":sk": "ORDER#"
}
```

### 6. Single Table vs Multi Table Design

#### Single Table Design (STD)
```
┌─────────────────────────────────────────────────────┐
│ Table: Application                                   │
├───────────────┬─────────────────┬───────────────────┤
│ PK            │ SK              │ Attributes        │
├───────────────┼─────────────────┼───────────────────┤
│ USER#001      │ PROFILE         │ name, email       │
│ USER#001      │ ORDER#2024-01   │ total, status     │
│ USER#001      │ ORDER#2024-02   │ total, status     │
│ ORDER#001     │ ORDER#001       │ (for GSI lookup)  │
│ PRODUCT#001   │ PRODUCT#001     │ name, price       │
└───────────────┴─────────────────┴───────────────────┘
```

#### Multi Table Design
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Table: Users    │  │ Table: Orders   │  │ Table: Products │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ userId (PK)     │  │ orderId (PK)    │  │ productId (PK)  │
│ name            │  │ userId          │  │ name            │
│ email           │  │ total           │  │ price           │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

| Aspect | Single Table | Multi Table |
|--------|--------------|-------------|
| **Complexity** | Higher upfront | Simpler |
| **Queries** | Efficient (1 query) | Multiple queries |
| **Maintenance** | Harder to understand | Easier |
| **Cost** | Lower (fewer tables) | Higher |
| **Best For** | Related data, high scale | Simple apps |

---

## Real-World Design Example: Blog Platform

### Access Patterns
1. Get user profile
2. Get all posts by user
3. Get post by postId
4. Get comments on a post
5. Get recent posts (global feed)

### Table Design
```
PK                  SK                      GSI1-PK         GSI1-SK
─────────────────────────────────────────────────────────────────────
USER#u1             PROFILE                 -               -
USER#u1             POST#2024-01-15#p1      POST#p1         POST#p1
USER#u1             POST#2024-01-16#p2      POST#p2         POST#p2
POST#p1             COMMENT#2024-01-15#c1   -               -
POST#p1             COMMENT#2024-01-15#c2   -               -
FEED                POST#2024-01-16#p2      -               -
FEED                POST#2024-01-15#p1      -               -
```

---

## Hands-On Demo

```bash
cd section-49-dynamodb-table-design/demo
cp .env.example .env
pnpm install
pnpm dev
```
