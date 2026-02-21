# Section 55: DynamoDB Transactions & Batch Operations

## Topics Covered

### 1. Transaction Types in DynamoDB
- TransactWriteItems (ACID writes)
- TransactGetItems (consistent reads)
- Batch operations vs transactions
- Cost and performance considerations

### 2. TransactWriteItems
```typescript
import { 
  DynamoDBDocumentClient, 
  TransactWriteCommand,
  TransactWriteCommandInput 
} from '@aws-sdk/lib-dynamodb';

// Transfer funds between accounts (classic transaction example)
async function transferFunds(
  client: DynamoDBDocumentClient,
  fromAccountId: string,
  toAccountId: string,
  amount: number
) {
  const params: TransactWriteCommandInput = {
    TransactItems: [
      // Debit from account
      {
        Update: {
          TableName: 'Accounts',
          Key: { accountId: fromAccountId },
          UpdateExpression: 'SET balance = balance - :amount',
          ConditionExpression: 'balance >= :amount',
          ExpressionAttributeValues: {
            ':amount': amount
          }
        }
      },
      // Credit to account
      {
        Update: {
          TableName: 'Accounts',
          Key: { accountId: toAccountId },
          UpdateExpression: 'SET balance = balance + :amount',
          ExpressionAttributeValues: {
            ':amount': amount
          }
        }
      },
      // Create transaction record
      {
        Put: {
          TableName: 'Transactions',
          Item: {
            transactionId: `TXN-${Date.now()}`,
            fromAccount: fromAccountId,
            toAccount: toAccountId,
            amount,
            timestamp: new Date().toISOString(),
            status: 'COMPLETED'
          }
        }
      }
    ]
  };

  try {
    await client.send(new TransactWriteCommand(params));
    return { success: true };
  } catch (error: any) {
    if (error.name === 'TransactionCanceledException') {
      // Check which condition failed
      const reasons = error.CancellationReasons;
      if (reasons[0]?.Code === 'ConditionalCheckFailed') {
        throw new Error('Insufficient funds');
      }
    }
    throw error;
  }
}
```

### 3. TransactGetItems
```typescript
import { TransactGetCommand } from '@aws-sdk/lib-dynamodb';

// Get multiple items consistently
async function getOrderDetails(
  client: DynamoDBDocumentClient,
  orderId: string,
  userId: string,
  productIds: string[]
) {
  const result = await client.send(new TransactGetCommand({
    TransactItems: [
      // Get order
      {
        Get: {
          TableName: 'Orders',
          Key: { orderId }
        }
      },
      // Get user
      {
        Get: {
          TableName: 'Users',
          Key: { userId }
        }
      },
      // Get products
      ...productIds.map(productId => ({
        Get: {
          TableName: 'Products',
          Key: { productId }
        }
      }))
    ]
  }));

  const [order, user, ...products] = result.Responses?.map(r => r.Item) || [];
  
  return { order, user, products };
}
```

### 4. Batch Operations
```typescript
import { 
  BatchWriteCommand, 
  BatchGetCommand 
} from '@aws-sdk/lib-dynamodb';

// Batch write (up to 25 items)
async function batchCreateProducts(
  client: DynamoDBDocumentClient,
  products: Product[]
) {
  // Split into chunks of 25
  const chunks = [];
  for (let i = 0; i < products.length; i += 25) {
    chunks.push(products.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    const result = await client.send(new BatchWriteCommand({
      RequestItems: {
        'Products': chunk.map(product => ({
          PutRequest: { Item: product }
        }))
      }
    }));

    // Handle unprocessed items (retry with exponential backoff)
    if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
      await retryUnprocessedItems(client, result.UnprocessedItems);
    }
  }
}

// Batch get (up to 100 items)
async function batchGetProducts(
  client: DynamoDBDocumentClient,
  productIds: string[]
) {
  const chunks = [];
  for (let i = 0; i < productIds.length; i += 100) {
    chunks.push(productIds.slice(i, i + 100));
  }

  const allProducts: Product[] = [];

  for (const chunk of chunks) {
    const result = await client.send(new BatchGetCommand({
      RequestItems: {
        'Products': {
          Keys: chunk.map(id => ({ productId: id }))
        }
      }
    }));

    allProducts.push(...(result.Responses?.['Products'] || []));

    // Handle unprocessed keys
    if (result.UnprocessedKeys && Object.keys(result.UnprocessedKeys).length > 0) {
      const retried = await retryUnprocessedKeys(client, result.UnprocessedKeys);
      allProducts.push(...retried);
    }
  }

  return allProducts;
}

// Retry helper with exponential backoff
async function retryUnprocessedItems(
  client: DynamoDBDocumentClient,
  unprocessedItems: Record<string, any[]>,
  retryCount = 0
) {
  if (retryCount >= 5) {
    throw new Error('Max retries exceeded for batch write');
  }

  // Exponential backoff
  await new Promise(resolve => 
    setTimeout(resolve, Math.pow(2, retryCount) * 100)
  );

  const result = await client.send(new BatchWriteCommand({
    RequestItems: unprocessedItems
  }));

  if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
    await retryUnprocessedItems(client, result.UnprocessedItems, retryCount + 1);
  }
}
```

### 5. Transaction vs Batch Comparison

| Feature | Transactions | Batch Operations |
|---------|--------------|------------------|
| **ACID** | ✅ Yes | ❌ No |
| **Max Items** | 100 | 25 (write), 100 (read) |
| **Cost** | 2x write capacity | 1x capacity |
| **Partial Failure** | All or nothing | Some may succeed |
| **Cross-Table** | ✅ Yes | ✅ Yes |
| **Conditions** | ✅ Yes | ❌ No |

### 6. Idempotency with Client Tokens
```typescript
import { v4 as uuidv4 } from 'uuid';

// Idempotent transaction
async function createOrderIdempotent(
  client: DynamoDBDocumentClient,
  orderData: OrderData,
  clientToken?: string
) {
  const token = clientToken || uuidv4();

  await client.send(new TransactWriteCommand({
    ClientRequestToken: token,  // Idempotency key
    TransactItems: [
      {
        Put: {
          TableName: 'Orders',
          Item: {
            orderId: orderData.orderId,
            ...orderData,
            idempotencyToken: token
          },
          ConditionExpression: 'attribute_not_exists(orderId)'
        }
      },
      {
        Update: {
          TableName: 'Users',
          Key: { userId: orderData.userId },
          UpdateExpression: 'SET orderCount = orderCount + :one',
          ExpressionAttributeValues: { ':one': 1 }
        }
      }
    ]
  }));

  return { orderId: orderData.orderId, token };
}

// Client can safely retry with same token
// DynamoDB will return success without re-executing
```

### 7. Optimistic Locking Pattern
```typescript
// Using version numbers for optimistic concurrency
async function updateProductWithVersion(
  client: DynamoDBDocumentClient,
  productId: string,
  updates: Partial<Product>,
  expectedVersion: number
) {
  try {
    await client.send(new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: 'Products',
            Key: { productId },
            UpdateExpression: 'SET #name = :name, price = :price, version = :newVersion',
            ConditionExpression: 'version = :expectedVersion',
            ExpressionAttributeNames: {
              '#name': 'name'
            },
            ExpressionAttributeValues: {
              ':name': updates.name,
              ':price': updates.price,
              ':expectedVersion': expectedVersion,
              ':newVersion': expectedVersion + 1
            }
          }
        }
      ]
    }));
    
    return { success: true, newVersion: expectedVersion + 1 };
  } catch (error: any) {
    if (error.name === 'TransactionCanceledException') {
      throw new Error('Concurrent modification detected. Please refresh and try again.');
    }
    throw error;
  }
}
```

### 8. Saga Pattern for Complex Workflows
```typescript
// For workflows that span multiple services/transactions
interface SagaStep {
  execute: () => Promise<void>;
  compensate: () => Promise<void>;
}

async function executeSaga(steps: SagaStep[]) {
  const completedSteps: SagaStep[] = [];

  try {
    for (const step of steps) {
      await step.execute();
      completedSteps.push(step);
    }
  } catch (error) {
    // Rollback in reverse order
    for (const step of completedSteps.reverse()) {
      try {
        await step.compensate();
      } catch (compensateError) {
        console.error('Compensation failed:', compensateError);
        // Log for manual intervention
      }
    }
    throw error;
  }
}

// Usage: Order placement saga
const orderSaga: SagaStep[] = [
  {
    execute: () => reserveInventory(items),
    compensate: () => releaseInventory(items)
  },
  {
    execute: () => chargePayment(userId, total),
    compensate: () => refundPayment(userId, total)
  },
  {
    execute: () => createOrder(orderData),
    compensate: () => cancelOrder(orderId)
  },
  {
    execute: () => sendConfirmation(userId, orderId),
    compensate: () => {} // No compensation needed
  }
];

await executeSaga(orderSaga);
```

---

## Prerequisites
- Completed Section 50-54 (DynamoDB sections)
- Understanding of ACID properties
- Docker (for DynamoDB Local)

## Getting Started

```bash
# Start DynamoDB Local
docker-compose -f docker-compose.dynamodb.yml up -d

# Setup demo
cd section-55-dynamodb-transactions/demo
cp .env.example .env
pnpm install
pnpm setup
pnpm dev
```

## Key Takeaways

- **Transactions** provide ACID guarantees across multiple items/tables
- **Batch operations** are faster and cheaper but not atomic
- **Idempotency tokens** enable safe retries
- **Optimistic locking** handles concurrent modifications
- **Saga pattern** manages complex multi-step workflows
