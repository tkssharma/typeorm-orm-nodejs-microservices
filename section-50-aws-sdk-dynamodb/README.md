# Section 50: AWS DynamoDB Client (AWS SDK v3)

## Topics Covered

### 1. AWS SDK v3 Overview
- Modular architecture (import only what you need)
- First-class TypeScript support
- Middleware stack for customization
- Tree-shakable for smaller bundles

```typescript
// AWS SDK v2 (old)
import AWS from 'aws-sdk';
const dynamodb = new AWS.DynamoDB();

// AWS SDK v3 (new - modular)
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
```

### 2. Setting Up Credentials Securely

```typescript
// Option 1: Environment variables (recommended for local dev)
// AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION

// Option 2: Credentials file (~/.aws/credentials)
const client = new DynamoDBClient({ region: 'us-east-1' });

// Option 3: Explicit credentials (NOT recommended)
const client = new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

// Option 4: DynamoDB Local
const client = new DynamoDBClient({
  region: 'local',
  endpoint: 'http://localhost:8000',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' }
});
```

### 3. DynamoDBClient vs DynamoDBDocumentClient

| Feature | DynamoDBClient | DynamoDBDocumentClient |
|---------|---------------|------------------------|
| **Data Format** | DynamoDB JSON | Native JavaScript |
| **Marshalling** | Manual | Automatic |
| **Use Case** | Low-level control | Most applications |

```typescript
// DynamoDBClient - requires marshalling
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
await client.send(new PutItemCommand({
  TableName: 'Users',
  Item: marshall({ userId: '123', name: 'John' })
}));

// DynamoDBDocumentClient - automatic marshalling
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const docClient = DynamoDBDocumentClient.from(client);
await docClient.send(new PutCommand({
  TableName: 'Users',
  Item: { userId: '123', name: 'John' }  // Native JS object
}));
```

### 4. CRUD Operations

#### PutItem (Create/Replace)
```typescript
import { PutCommand } from '@aws-sdk/lib-dynamodb';

// Create or replace item
await docClient.send(new PutCommand({
  TableName: 'Users',
  Item: {
    PK: 'USER#123',
    SK: 'PROFILE',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date().toISOString()
  },
  // Prevent overwriting existing item
  ConditionExpression: 'attribute_not_exists(PK)'
}));
```

#### GetItem (Read)
```typescript
import { GetCommand } from '@aws-sdk/lib-dynamodb';

const result = await docClient.send(new GetCommand({
  TableName: 'Users',
  Key: {
    PK: 'USER#123',
    SK: 'PROFILE'
  },
  // Optional: only return specific attributes
  ProjectionExpression: 'name, email'
}));

console.log(result.Item); // { name: 'John Doe', email: 'john@example.com' }
```

#### UpdateItem (Partial Update)
```typescript
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Atomic update
const result = await docClient.send(new UpdateCommand({
  TableName: 'Users',
  Key: {
    PK: 'USER#123',
    SK: 'PROFILE'
  },
  UpdateExpression: 'SET #name = :name, updatedAt = :updatedAt ADD loginCount :inc',
  ExpressionAttributeNames: {
    '#name': 'name'  // 'name' is reserved word
  },
  ExpressionAttributeValues: {
    ':name': 'John Smith',
    ':updatedAt': new Date().toISOString(),
    ':inc': 1
  },
  ReturnValues: 'ALL_NEW'
}));

console.log(result.Attributes); // Updated item
```

#### DeleteItem
```typescript
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';

await docClient.send(new DeleteCommand({
  TableName: 'Users',
  Key: {
    PK: 'USER#123',
    SK: 'PROFILE'
  },
  // Only delete if condition met
  ConditionExpression: 'isActive = :false',
  ExpressionAttributeValues: {
    ':false': false
  }
}));
```

### 5. Query vs Scan (Critical Difference)

```
┌────────────────────────────────────────────────────────────┐
│                         TABLE                               │
├────────────────────────────────────────────────────────────┤
│  QUERY: Uses index, efficient     SCAN: Reads ENTIRE table │
│  ┌──────┐                         ┌──────────────────────┐ │
│  │ ████ │ ← Only reads matching   │ ████████████████████ │ │
│  └──────┘   items                 │ ████████████████████ │ │
│                                   │ ████████████████████ │ │
│  Cost: Low                        └──────────────────────┘ │
│  Speed: Fast                       Cost: HIGH              │
│                                    Speed: SLOW             │
└────────────────────────────────────────────────────────────┘
```

#### Query (Efficient - Use This!)
```typescript
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

// Get all orders for a user
const result = await docClient.send(new QueryCommand({
  TableName: 'Application',
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
  ExpressionAttributeValues: {
    ':pk': 'USER#123',
    ':sk': 'ORDER#'
  },
  // Optional: filter results (after query)
  FilterExpression: 'total > :minTotal',
  ExpressionAttributeValues: {
    ':pk': 'USER#123',
    ':sk': 'ORDER#',
    ':minTotal': 100
  },
  ScanIndexForward: false,  // Sort descending
  Limit: 10
}));
```

#### Scan (Avoid When Possible)
```typescript
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

// Only use for admin tasks, exports, etc.
const result = await docClient.send(new ScanCommand({
  TableName: 'Users',
  FilterExpression: 'contains(email, :domain)',
  ExpressionAttributeValues: {
    ':domain': '@example.com'
  }
}));
```

### 6. Handling Pagination
```typescript
async function getAllItems(tableName: string) {
  const items: any[] = [];
  let lastKey: Record<string, any> | undefined;

  do {
    const result = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': 'USER#123' },
      ExclusiveStartKey: lastKey
    }));

    items.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}
```

### 7. Error Handling Best Practices
```typescript
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

try {
  await docClient.send(new PutCommand({
    TableName: 'Users',
    Item: { PK: 'USER#123', SK: 'PROFILE', name: 'John' },
    ConditionExpression: 'attribute_not_exists(PK)'
  }));
} catch (error) {
  if (error instanceof ConditionalCheckFailedException) {
    console.log('User already exists');
  } else if (error.name === 'ProvisionedThroughputExceededException') {
    console.log('Too many requests - implement retry');
  } else {
    throw error;
  }
}
```

---

## Hands-On Demo

```bash
cd section-50-aws-sdk-dynamodb/demo
cp .env.example .env
pnpm install
pnpm dev
```
