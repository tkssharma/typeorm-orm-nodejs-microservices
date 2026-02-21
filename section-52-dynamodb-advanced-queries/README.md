# Section 52: Advanced Query Patterns

## Topics Covered

### 1. Querying with Partition + Sort Keys

```typescript
// Table structure:
// PK: USER#<userId>
// SK: ORDER#<date>#<orderId>

// Get specific order
const order = await docClient.send(new GetCommand({
  TableName: 'Application',
  Key: {
    PK: 'USER#123',
    SK: 'ORDER#2024-01-15#ORD001'
  }
}));

// Get all orders for user
const allOrders = await docClient.send(new QueryCommand({
  TableName: 'Application',
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
  ExpressionAttributeValues: {
    ':pk': 'USER#123',
    ':sk': 'ORDER#'
  }
}));
```

### 2. Begins_with & Between Queries

```typescript
// begins_with - prefix matching
const januaryOrders = await docClient.send(new QueryCommand({
  TableName: 'Application',
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
  ExpressionAttributeValues: {
    ':pk': 'USER#123',
    ':prefix': 'ORDER#2024-01'
  }
}));

// between - range queries
const q1Orders = await docClient.send(new QueryCommand({
  TableName: 'Application',
  KeyConditionExpression: 'PK = :pk AND SK BETWEEN :start AND :end',
  ExpressionAttributeValues: {
    ':pk': 'USER#123',
    ':start': 'ORDER#2024-01-01',
    ':end': 'ORDER#2024-03-31'
  }
}));

// Comparison operators on SK
const recentOrders = await docClient.send(new QueryCommand({
  TableName: 'Application',
  KeyConditionExpression: 'PK = :pk AND SK >= :date',
  ExpressionAttributeValues: {
    ':pk': 'USER#123',
    ':date': 'ORDER#2024-01-01'
  },
  ScanIndexForward: false  // Newest first
}));
```

### 3. Conditional Writes

```typescript
// Only create if not exists
await docClient.send(new PutCommand({
  TableName: 'Users',
  Item: { PK: 'USER#123', SK: 'PROFILE', name: 'John' },
  ConditionExpression: 'attribute_not_exists(PK)'
}));

// Only update if version matches (optimistic locking)
await docClient.send(new UpdateCommand({
  TableName: 'Products',
  Key: { PK: 'PROD#001', SK: 'PRODUCT' },
  UpdateExpression: 'SET stock = stock - :qty, version = version + :one',
  ConditionExpression: 'version = :currentVersion AND stock >= :qty',
  ExpressionAttributeValues: {
    ':qty': 1,
    ':one': 1,
    ':currentVersion': 5
  }
}));

// Only delete if condition met
await docClient.send(new DeleteCommand({
  TableName: 'Sessions',
  Key: { PK: 'SESSION#abc', SK: 'SESSION' },
  ConditionExpression: 'expiresAt < :now',
  ExpressionAttributeValues: {
    ':now': new Date().toISOString()
  }
}));
```

### 4. Filtering vs Key Conditions

```
┌─────────────────────────────────────────────────────────────┐
│ KeyConditionExpression        FilterExpression              │
│ ────────────────────────      ─────────────────────         │
│ • Runs BEFORE reading         • Runs AFTER reading          │
│ • Uses indexes efficiently    • Reads then discards         │
│ • Only PK and SK              • Any attribute               │
│ • Reduces read capacity       • Still consumes capacity     │
│ • ALWAYS prefer this          • Use sparingly               │
└─────────────────────────────────────────────────────────────┘
```

```typescript
// ❌ BAD: Filter on status (reads all, then filters)
const result = await docClient.send(new QueryCommand({
  TableName: 'Orders',
  KeyConditionExpression: 'PK = :pk',
  FilterExpression: 'status = :status',  // Inefficient!
  ExpressionAttributeValues: {
    ':pk': 'USER#123',
    ':status': 'pending'
  }
}));
// Reads 1000 items, returns 10 (wasted 990 reads)

// ✅ GOOD: Use GSI with status as key
const result = await docClient.send(new QueryCommand({
  TableName: 'Orders',
  IndexName: 'GSI-Status',
  KeyConditionExpression: 'GSI1PK = :status AND GSI1SK = :userId',
  ExpressionAttributeValues: {
    ':status': 'STATUS#pending',
    ':userId': 'USER#123'
  }
}));
// Reads only 10 items
```

### 5. Efficient Pagination

```typescript
interface PaginatedResult<T> {
  items: T[];
  nextToken?: string;
}

async function paginateQuery<T>(
  params: QueryCommandInput,
  pageSize: number = 20
): Promise<PaginatedResult<T>> {
  const result = await docClient.send(new QueryCommand({
    ...params,
    Limit: pageSize
  }));

  return {
    items: result.Items as T[],
    nextToken: result.LastEvaluatedKey 
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : undefined
  };
}

// Usage with cursor-based pagination
async function getOrders(userId: string, cursor?: string) {
  const params: QueryCommandInput = {
    TableName: 'Application',
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'ORDER#'
    },
    ScanIndexForward: false
  };

  if (cursor) {
    params.ExclusiveStartKey = JSON.parse(
      Buffer.from(cursor, 'base64').toString()
    );
  }

  return paginateQuery(params, 20);
}

// API response
// GET /users/123/orders?cursor=eyJQSyI6IlVTRVIjMTIzIiwiU0siOiJPUkRFUiMy...
```

### 6. Avoiding Scans

| Scenario | ❌ Scan Approach | ✅ Better Approach |
|----------|------------------|-------------------|
| Find user by email | Scan + filter | GSI on email |
| Recent orders | Scan + sort | SK with date prefix |
| Orders by status | Scan + filter | GSI on status |
| Admin dashboard | Full table scan | Aggregation table |

```typescript
// ❌ NEVER do this in production
const allPending = await docClient.send(new ScanCommand({
  TableName: 'Orders',
  FilterExpression: 'status = :status',
  ExpressionAttributeValues: { ':status': 'pending' }
}));

// ✅ Design your table to avoid scans
// Option 1: GSI on status
// Option 2: Status collection pattern
// PK: STATUS#pending, SK: ORDER#<timestamp>#<orderId>
```

---

## Atomic Operations

### Counter Updates
```typescript
// Atomic increment
await docClient.send(new UpdateCommand({
  TableName: 'Products',
  Key: { PK: 'PROD#001', SK: 'STATS' },
  UpdateExpression: 'ADD viewCount :inc, purchaseCount :inc',
  ExpressionAttributeValues: {
    ':inc': 1
  }
}));

// Atomic decrement with check
await docClient.send(new UpdateCommand({
  TableName: 'Products',
  Key: { PK: 'PROD#001', SK: 'INVENTORY' },
  UpdateExpression: 'SET stock = stock - :qty',
  ConditionExpression: 'stock >= :qty',
  ExpressionAttributeValues: {
    ':qty': 1
  }
}));
```

### Set Operations
```typescript
// Add to set
await docClient.send(new UpdateCommand({
  TableName: 'Users',
  Key: { PK: 'USER#123', SK: 'PROFILE' },
  UpdateExpression: 'ADD tags :newTags',
  ExpressionAttributeValues: {
    ':newTags': new Set(['premium', 'verified'])
  }
}));

// Remove from set
await docClient.send(new UpdateCommand({
  TableName: 'Users',
  Key: { PK: 'USER#123', SK: 'PROFILE' },
  UpdateExpression: 'DELETE tags :removeTags',
  ExpressionAttributeValues: {
    ':removeTags': new Set(['trial'])
  }
}));
```

---

## Hands-On Demo

```bash
cd section-52-dynamodb-advanced-queries/demo
cp .env.example .env
pnpm install
pnpm dev
```
