# Section 54: DynamoDB Single Table Design

## Topics Covered

### 1. What is Single Table Design?
- Storing multiple entity types in one table
- Access pattern driven design
- Reducing table count and cost
- When to use (and when not to)

### 2. Single Table Design Principles
```
Traditional SQL (Multiple Tables):
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Users     │     │   Orders    │     │   Products  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │────>│ user_id     │     │ id          │
│ name        │     │ product_id  │<────│ name        │
│ email       │     │ quantity    │     │ price       │
└─────────────┘     └─────────────┘     └─────────────┘

DynamoDB Single Table:
┌─────────────────────────────────────────────────────────┐
│                    ApplicationTable                      │
├──────────────────┬──────────────────┬───────────────────┤
│ PK               │ SK               │ Attributes        │
├──────────────────┼──────────────────┼───────────────────┤
│ USER#123         │ PROFILE          │ name, email       │
│ USER#123         │ ORDER#001        │ total, status     │
│ USER#123         │ ORDER#002        │ total, status     │
│ ORDER#001        │ ITEM#prod-1      │ quantity, price   │
│ ORDER#001        │ ITEM#prod-2      │ quantity, price   │
│ PRODUCT#prod-1   │ PRODUCT#prod-1   │ name, price       │
└──────────────────┴──────────────────┴───────────────────┘
```

### 3. Entity Prefixes & Key Design
```typescript
// Entity types and their key patterns
const ENTITY_PREFIXES = {
  USER: 'USER#',
  ORDER: 'ORDER#',
  PRODUCT: 'PRODUCT#',
  CATEGORY: 'CAT#'
} as const;

// Key patterns for different access patterns
interface KeyPatterns {
  // Get user profile
  getUserProfile: { PK: 'USER#123', SK: 'PROFILE' };
  
  // Get all orders for a user
  getUserOrders: { PK: 'USER#123', SK: 'begins_with ORDER#' };
  
  // Get specific order
  getOrder: { PK: 'ORDER#001', SK: 'ORDER#001' };
  
  // Get all items in an order
  getOrderItems: { PK: 'ORDER#001', SK: 'begins_with ITEM#' };
}
```

### 4. Implementing Single Table Design
```typescript
// src/entities.ts
interface User {
  PK: string;         // USER#<userId>
  SK: string;         // PROFILE
  entityType: 'USER';
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Order {
  PK: string;         // USER#<userId>
  SK: string;         // ORDER#<orderId>
  entityType: 'ORDER';
  orderId: string;
  userId: string;
  total: number;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED';
  createdAt: string;
  
  // GSI for querying orders by status
  GSI1PK: string;     // ORDER#<orderId>
  GSI1SK: string;     // STATUS#<status>
}

interface OrderItem {
  PK: string;         // ORDER#<orderId>
  SK: string;         // ITEM#<productId>
  entityType: 'ORDER_ITEM';
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

interface Product {
  PK: string;         // PRODUCT#<productId>
  SK: string;         // PRODUCT#<productId>
  entityType: 'PRODUCT';
  productId: string;
  name: string;
  price: number;
  category: string;
  
  // GSI for querying by category
  GSI1PK: string;     // CAT#<category>
  GSI1SK: string;     // PRODUCT#<productId>
}
```

### 5. CRUD Operations
```typescript
// src/operations.ts
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME!;

// Create user
async function createUser(client: DynamoDBDocumentClient, user: Omit<User, 'PK' | 'SK' | 'entityType'>) {
  const item: User = {
    PK: `USER#${user.userId}`,
    SK: 'PROFILE',
    entityType: 'USER',
    ...user,
    createdAt: new Date().toISOString()
  };

  await client.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
    ConditionExpression: 'attribute_not_exists(PK)'
  }));

  return item;
}

// Create order with items (transaction)
async function createOrder(
  client: DynamoDBDocumentClient,
  userId: string,
  items: { productId: string; quantity: number; price: number }[]
) {
  const orderId = `ORD-${Date.now()}`;
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const transactItems = [
    // Order record (under user partition)
    {
      Put: {
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `ORDER#${orderId}`,
          entityType: 'ORDER',
          orderId,
          userId,
          total,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          GSI1PK: `ORDER#${orderId}`,
          GSI1SK: 'STATUS#PENDING'
        }
      }
    },
    // Order items
    ...items.map(item => ({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          PK: `ORDER#${orderId}`,
          SK: `ITEM#${item.productId}`,
          entityType: 'ORDER_ITEM',
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }
      }
    }))
  ];

  await client.send(new TransactWriteCommand({ TransactItems: transactItems }));
  
  return { orderId, total };
}

// Get user with all orders
async function getUserWithOrders(client: DynamoDBDocumentClient, userId: string) {
  const result = await client.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`
    }
  }));

  const items = result.Items || [];
  const user = items.find(item => item.SK === 'PROFILE');
  const orders = items.filter(item => item.SK.startsWith('ORDER#'));

  return { user, orders };
}

// Get order with all items
async function getOrderWithItems(client: DynamoDBDocumentClient, orderId: string) {
  // Query order details (from GSI)
  const orderResult = await client.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `ORDER#${orderId}`
    }
  }));

  // Query order items
  const itemsResult = await client.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `ORDER#${orderId}`
    }
  }));

  return {
    order: orderResult.Items?.[0],
    items: itemsResult.Items || []
  };
}
```

### 6. GSI Design for Access Patterns
```
GSI1 (Global Secondary Index):
┌──────────────────┬──────────────────┬───────────────────┐
│ GSI1PK           │ GSI1SK           │ Projected         │
├──────────────────┼──────────────────┼───────────────────┤
│ ORDER#001        │ STATUS#PENDING   │ All attributes    │
│ ORDER#002        │ STATUS#SHIPPED   │ All attributes    │
│ CAT#electronics  │ PRODUCT#prod-1   │ All attributes    │
│ CAT#electronics  │ PRODUCT#prod-2   │ All attributes    │
│ CAT#clothing     │ PRODUCT#prod-3   │ All attributes    │
└──────────────────┴──────────────────┴───────────────────┘

Access patterns enabled:
- Get all orders by status
- Get all products in a category
- Get order details by orderId
```

### 7. Adjacency List Pattern
```typescript
// For many-to-many relationships (e.g., user follows user)

// User follows another user
interface Follow {
  PK: string;         // USER#<followerId>
  SK: string;         // FOLLOWS#<followeeId>
  entityType: 'FOLLOW';
  followerId: string;
  followeeId: string;
  createdAt: string;
  
  // GSI for reverse lookup (who follows me?)
  GSI1PK: string;     // USER#<followeeId>
  GSI1SK: string;     // FOLLOWER#<followerId>
}

// Get users I follow
async function getFollowing(userId: string) {
  return client.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'FOLLOWS#'
    }
  }));
}

// Get my followers (using GSI)
async function getFollowers(userId: string) {
  return client.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'FOLLOWER#'
    }
  }));
}
```

### 8. When NOT to Use Single Table
| Scenario | Recommendation |
|----------|----------------|
| Simple CRUD app | Multiple tables may be simpler |
| Heavy analytics | Use separate analytics table |
| Frequent schema changes | Multiple tables offer flexibility |
| Team unfamiliar with DynamoDB | Start with multiple tables |
| Independent scaling needs | Separate tables allow independent provisioning |

---

## Prerequisites
- Completed Section 49-53 (DynamoDB basics)
- Understanding of access patterns
- Docker (for DynamoDB Local)

## Getting Started

```bash
# Start DynamoDB Local
docker-compose -f docker-compose.dynamodb.yml up -d

# Setup demo
cd section-54-dynamodb-single-table/demo
cp .env.example .env
pnpm install
pnpm setup    # Create table with GSI
pnpm dev
```

## Key Takeaways

- **Single table** reduces operational overhead and cost
- **Entity prefixes** differentiate record types
- **GSIs** enable additional access patterns
- **Transactions** maintain data consistency
- **Not always the answer** - evaluate complexity vs benefits
