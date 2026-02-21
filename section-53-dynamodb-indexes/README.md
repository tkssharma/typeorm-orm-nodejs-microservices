# Section 53: Secondary Indexes (GSIs & LSIs)

## Why Secondary Indexes Exist

DynamoDB only allows efficient queries on primary key attributes. Secondary indexes enable querying on **different attributes**.

```
Without Index:                    With GSI:
─────────────────                 ─────────────────
Query by userId ✅                Query by userId ✅
Query by email ❌ (Scan!)         Query by email ✅ (GSI)
Query by status ❌ (Scan!)        Query by status ✅ (GSI)
```

---

## Topics Covered

### 1. Global Secondary Indexes (GSI)

- **Different partition key** than base table
- Can be created/deleted anytime
- Has its own provisioned throughput
- Eventually consistent reads only
- Can have different sort key

```typescript
// Base table
// PK: USER#<userId>, SK: PROFILE

// GSI for email lookup
// GSI1PK: EMAIL#<email>, GSI1SK: USER#<userId>

// Create table with GSI
await dynamoDBClient.send(new CreateTableCommand({
  TableName: 'Users',
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' },
    { AttributeName: 'SK', KeyType: 'RANGE' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GSI1',
      KeySchema: [
        { AttributeName: 'GSI1PK', KeyType: 'HASH' },
        { AttributeName: 'GSI1SK', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ],
  // ... other config
}));

// Query GSI
const userByEmail = await docClient.send(new QueryCommand({
  TableName: 'Users',
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :email',
  ExpressionAttributeValues: {
    ':email': 'EMAIL#john@example.com'
  }
}));
```

### 2. Local Secondary Indexes (LSI)

- **Same partition key** as base table
- Different sort key
- Must be created at table creation time
- Shares throughput with base table
- Supports strongly consistent reads
- Max 5 LSIs per table

```typescript
// Base table: PK = USER#<id>, SK = ORDER#<date>
// LSI: PK = USER#<id>, LSI1SK = TOTAL#<amount>

await dynamoDBClient.send(new CreateTableCommand({
  TableName: 'Orders',
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' },
    { AttributeName: 'SK', KeyType: 'RANGE' }
  ],
  LocalSecondaryIndexes: [
    {
      IndexName: 'LSI-ByTotal',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'orderTotal', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  // ...
}));

// Query: Get user's orders sorted by total
const ordersByTotal = await docClient.send(new QueryCommand({
  TableName: 'Orders',
  IndexName: 'LSI-ByTotal',
  KeyConditionExpression: 'PK = :pk',
  ExpressionAttributeValues: {
    ':pk': 'USER#123'
  },
  ScanIndexForward: false  // Highest first
}));
```

### 3. GSI vs LSI Comparison

| Feature | GSI | LSI |
|---------|-----|-----|
| **Partition Key** | Different from table | Same as table |
| **Sort Key** | Optional | Required (different) |
| **Creation** | Anytime | Table creation only |
| **Throughput** | Separate | Shared with table |
| **Consistency** | Eventually only | Strong or eventual |
| **Max per table** | 20 | 5 |
| **Size limit** | None | 10GB per partition |

### 4. Designing GSIs for New Access Patterns

```typescript
// E-commerce: Multiple access patterns

// Base Table Design
// ──────────────────────────────────────────────────────────
// PK              SK                  GSI1PK          GSI1SK
// ──────────────────────────────────────────────────────────
// USER#123        PROFILE             EMAIL#john@...  USER#123
// USER#123        ORDER#2024-01-15    ORDER#ORD001    ORDER#ORD001
// ORDER#ORD001    ORDER#ORD001        STATUS#pending  2024-01-15
// PRODUCT#P001    PRODUCT#P001        CAT#electronics PRODUCT#P001

// Access Patterns:
// 1. Get user by ID         → Query PK = USER#<id>, SK = PROFILE
// 2. Get user by email      → Query GSI1, GSI1PK = EMAIL#<email>
// 3. Get order by ID        → Query GSI1, GSI1PK = ORDER#<id>
// 4. Get pending orders     → Query GSI1, GSI1PK = STATUS#pending
// 5. Get products by cat    → Query GSI1, GSI1PK = CAT#<category>
```

### 5. GSI Performance & Cost Tradeoffs

```
Write Operation:
┌─────────────┐     ┌─────────────┐
│ Base Table  │ ──► │    GSI 1    │  Cost: Base + GSI writes
│  (1 WCU)    │     │   (1 WCU)   │
└─────────────┘     └─────────────┘
                         │
                         ▼
                    ┌─────────────┐
                    │    GSI 2    │
                    │   (1 WCU)   │
                    └─────────────┘

Total cost: 3 WCUs for 1 item write
```

#### Projection Types
```typescript
// ALL - project all attributes (most flexible, most storage)
Projection: { ProjectionType: 'ALL' }

// KEYS_ONLY - project only key attributes (smallest)
Projection: { ProjectionType: 'KEYS_ONLY' }

// INCLUDE - project specific attributes
Projection: {
  ProjectionType: 'INCLUDE',
  NonKeyAttributes: ['name', 'email', 'status']
}
```

#### Best Practices
1. **Minimize GSIs** - Each one costs writes
2. **Use sparse indexes** - Only index items that need it
3. **Choose projection wisely** - Don't over-project
4. **Monitor GSI throttling** - Can throttle base table

---

## Sparse Index Pattern

Only items with the GSI key attributes are indexed:

```typescript
// Only index "featured" products
const featuredProduct = {
  PK: 'PRODUCT#001',
  SK: 'PRODUCT',
  name: 'Premium Widget',
  GSI_FEATURED: 'FEATURED',  // ← Only add for featured
  featuredRank: 1
};

const regularProduct = {
  PK: 'PRODUCT#002',
  SK: 'PRODUCT',
  name: 'Basic Widget'
  // No GSI_FEATURED attribute = not in index
};

// Query featured products only
const featured = await docClient.send(new QueryCommand({
  TableName: 'Products',
  IndexName: 'GSI-Featured',
  KeyConditionExpression: 'GSI_FEATURED = :featured',
  ExpressionAttributeValues: {
    ':featured': 'FEATURED'
  }
}));
```

---

## Overloaded GSI Pattern

Use generic GSI key names to support multiple access patterns:

```typescript
// Item examples with overloaded GSI1
const items = [
  // User - GSI1 for email lookup
  {
    PK: 'USER#123',
    SK: 'PROFILE',
    GSI1PK: 'EMAIL#john@example.com',
    GSI1SK: 'USER#123'
  },
  // Order - GSI1 for status lookup
  {
    PK: 'USER#123',
    SK: 'ORDER#2024-01-15',
    GSI1PK: 'STATUS#pending',
    GSI1SK: '2024-01-15#ORD001'
  },
  // Product - GSI1 for category
  {
    PK: 'PRODUCT#001',
    SK: 'PRODUCT',
    GSI1PK: 'CATEGORY#electronics',
    GSI1SK: 'PRODUCT#001'
  }
];
```

---

## Hands-On Demo

```bash
cd section-53-dynamodb-indexes/demo
cp .env.example .env
pnpm install
pnpm dev
```
