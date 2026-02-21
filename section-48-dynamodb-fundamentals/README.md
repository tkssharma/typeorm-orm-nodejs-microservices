# Section 48: DynamoDB Fundamentals (Core Focus)

## Topics Covered

### 1. What is DynamoDB
- Fully managed NoSQL database by AWS
- Serverless - no servers to manage
- Single-digit millisecond latency at any scale
- Built-in security, backup, and restore
- Global tables for multi-region deployment

### 2. Fully Managed NoSQL Explained
```
Traditional Database          DynamoDB
─────────────────────         ─────────────────────
You manage:                   AWS manages:
• Hardware                    • Hardware
• OS patching                 • OS patching
• Database software           • Database software
• Backups                     • Backups
• Scaling                     • Scaling
• Replication                 • Replication
```

### 3. Tables, Items & Attributes

```
┌─────────────────────────────────────────────────────┐
│                     TABLE: Users                     │
├─────────────────────────────────────────────────────┤
│ Item 1:                                              │
│   PK: "USER#123"                                     │
│   SK: "PROFILE"                                      │
│   name: "John Doe"                                   │
│   email: "john@example.com"                          │
│   createdAt: "2024-01-15"                           │
├─────────────────────────────────────────────────────┤
│ Item 2:                                              │
│   PK: "USER#123"                                     │
│   SK: "ORDER#001"                                    │
│   total: 99.99                                       │
│   status: "shipped"                                  │
└─────────────────────────────────────────────────────┘
```

- **Table**: Collection of items (like a MongoDB collection)
- **Item**: Single record (like a document, max 400KB)
- **Attribute**: Key-value pair within an item

### 4. Primary Keys: Partition Key & Sort Key

#### Simple Primary Key (Partition Key Only)
```typescript
// Table: Products
{
  ProductId: "PROD-001",  // Partition Key (PK)
  name: "Laptop",
  price: 999.99
}
```

#### Composite Primary Key (Partition Key + Sort Key)
```typescript
// Table: Orders
{
  CustomerId: "CUST-001",    // Partition Key (PK)
  OrderDate: "2024-01-15",   // Sort Key (SK)
  total: 150.00,
  status: "delivered"
}
```

### 5. Data Types in DynamoDB

| Type | Symbol | Example |
|------|--------|---------|
| **String** | S | `"Hello World"` |
| **Number** | N | `42`, `3.14` |
| **Binary** | B | Base64 encoded |
| **Boolean** | BOOL | `true`, `false` |
| **Null** | NULL | `null` |
| **List** | L | `["a", "b", 1, 2]` |
| **Map** | M | `{ "key": "value" }` |
| **String Set** | SS | `["a", "b", "c"]` |
| **Number Set** | NS | `[1, 2, 3]` |
| **Binary Set** | BS | Binary array |

```typescript
// Example item with various types
{
  userId: { S: "USER-001" },           // String
  age: { N: "30" },                     // Number (always string in wire format)
  isActive: { BOOL: true },             // Boolean
  tags: { SS: ["admin", "verified"] },  // String Set
  metadata: {                           // Map
    M: {
      lastLogin: { S: "2024-01-15" },
      loginCount: { N: "42" }
    }
  },
  orders: {                             // List
    L: [
      { S: "ORDER-001" },
      { S: "ORDER-002" }
    ]
  }
}
```

### 6. Strong vs Eventual Consistency

| Consistency | Read Type | Use Case | Cost |
|-------------|-----------|----------|------|
| **Eventually Consistent** | Default | Most reads | 0.5 RCU per 4KB |
| **Strongly Consistent** | Optional | Critical reads | 1 RCU per 4KB |

```typescript
// Eventually consistent read (default)
const result = await client.send(new GetItemCommand({
  TableName: "Users",
  Key: { userId: { S: "USER-001" } }
}));

// Strongly consistent read
const result = await client.send(new GetItemCommand({
  TableName: "Users",
  Key: { userId: { S: "USER-001" } },
  ConsistentRead: true  // Strongly consistent
}));
```

---

## Key Concepts Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        DynamoDB Table                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Partition A          Partition B          Partition C        │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐   │
│  │ PK: USER#1  │      │ PK: USER#2  │      │ PK: USER#3  │   │
│  │ SK: PROFILE │      │ SK: PROFILE │      │ SK: PROFILE │   │
│  │ SK: ORDER#1 │      │ SK: ORDER#1 │      │ SK: ORDER#1 │   │
│  │ SK: ORDER#2 │      │ SK: ORDER#2 │      │ SK: ORDER#2 │   │
│  └─────────────┘      └─────────────┘      └─────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Hands-On Demo

```bash
cd section-48-dynamodb-fundamentals/demo
cp .env.example .env
pnpm install
pnpm dev
```
