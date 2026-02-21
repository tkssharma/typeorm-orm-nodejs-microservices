# Section 56: DynamoDB Streams & Event-Driven Architecture

## Topics Covered

### 1. What are DynamoDB Streams?
- Change data capture (CDC)
- Stream records and event types
- Near real-time processing
- Use cases and patterns

### 2. Stream Record Types
```typescript
// Stream event types
type StreamViewType = 
  | 'KEYS_ONLY'       // Only key attributes
  | 'NEW_IMAGE'       // Item after modification
  | 'OLD_IMAGE'       // Item before modification
  | 'NEW_AND_OLD_IMAGES'; // Both before and after

// Stream record structure
interface StreamRecord {
  eventID: string;
  eventName: 'INSERT' | 'MODIFY' | 'REMOVE';
  eventVersion: string;
  eventSource: 'aws:dynamodb';
  awsRegion: string;
  dynamodb: {
    Keys: Record<string, AttributeValue>;
    NewImage?: Record<string, AttributeValue>;
    OldImage?: Record<string, AttributeValue>;
    SequenceNumber: string;
    SizeBytes: number;
    StreamViewType: StreamViewType;
  };
}
```

### 3. Enabling Streams on Table
```typescript
import { 
  DynamoDBClient, 
  UpdateTableCommand,
  DescribeTableCommand 
} from '@aws-sdk/client-dynamodb';

async function enableStreams(tableName: string) {
  const client = new DynamoDBClient({});
  
  await client.send(new UpdateTableCommand({
    TableName: tableName,
    StreamSpecification: {
      StreamEnabled: true,
      StreamViewType: 'NEW_AND_OLD_IMAGES'
    }
  }));

  // Get stream ARN
  const table = await client.send(new DescribeTableCommand({
    TableName: tableName
  }));

  return table.Table?.LatestStreamArn;
}
```

### 4. Lambda Stream Processor
```typescript
// lambda/stream-processor.ts
import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';

export async function handler(event: DynamoDBStreamEvent) {
  for (const record of event.Records) {
    await processRecord(record);
  }
}

async function processRecord(record: DynamoDBRecord) {
  const { eventName, dynamodb } = record;
  
  if (!dynamodb) return;

  switch (eventName) {
    case 'INSERT':
      await handleInsert(dynamodb.NewImage);
      break;
    case 'MODIFY':
      await handleModify(dynamodb.OldImage, dynamodb.NewImage);
      break;
    case 'REMOVE':
      await handleRemove(dynamodb.OldImage);
      break;
  }
}

async function handleInsert(newImage: any) {
  const item = unmarshall(newImage);
  console.log('New item created:', item);
  
  // Example: Send welcome email for new users
  if (item.entityType === 'USER') {
    await sendWelcomeEmail(item.email);
  }
  
  // Example: Update search index
  await indexDocument(item);
}

async function handleModify(oldImage: any, newImage: any) {
  const oldItem = unmarshall(oldImage);
  const newItem = unmarshall(newImage);
  
  console.log('Item modified:', { old: oldItem, new: newItem });
  
  // Example: Detect status change
  if (oldItem.status !== newItem.status) {
    await notifyStatusChange(newItem.id, oldItem.status, newItem.status);
  }
  
  // Example: Update search index
  await updateDocument(newItem);
}

async function handleRemove(oldImage: any) {
  const item = unmarshall(oldImage);
  console.log('Item deleted:', item);
  
  // Example: Remove from search index
  await removeDocument(item.id);
  
  // Example: Cleanup related data
  await cleanupRelatedData(item);
}
```

### 5. Event Sourcing Pattern
```typescript
// Store all changes as events
interface DomainEvent {
  PK: string;           // ENTITY#<entityId>
  SK: string;           // EVENT#<timestamp>#<eventId>
  entityType: string;
  eventType: string;
  payload: any;
  timestamp: string;
  version: number;
}

// Stream processor builds read models
async function buildReadModel(record: DynamoDBRecord) {
  const event = unmarshall(record.dynamodb?.NewImage);
  
  switch (event.eventType) {
    case 'OrderCreated':
      await createOrderReadModel(event.payload);
      break;
    case 'OrderItemAdded':
      await addItemToOrderReadModel(event.payload);
      break;
    case 'OrderShipped':
      await updateOrderStatus(event.payload.orderId, 'SHIPPED');
      break;
  }
}

// Replay events to rebuild read model
async function replayEvents(entityId: string) {
  const events = await queryEvents(entityId);
  
  let state = {};
  for (const event of events) {
    state = applyEvent(state, event);
  }
  
  return state;
}
```

### 6. Cross-Region Replication
```typescript
// Stream processor for cross-region replication
async function replicateToRegion(record: DynamoDBRecord) {
  const targetClient = new DynamoDBDocumentClient({
    region: 'eu-west-1'  // Target region
  });

  const { eventName, dynamodb } = record;

  switch (eventName) {
    case 'INSERT':
    case 'MODIFY':
      const item = unmarshall(dynamodb.NewImage);
      await targetClient.send(new PutCommand({
        TableName: 'ReplicaTable',
        Item: item
      }));
      break;
      
    case 'REMOVE':
      const keys = unmarshall(dynamodb.Keys);
      await targetClient.send(new DeleteCommand({
        TableName: 'ReplicaTable',
        Key: keys
      }));
      break;
  }
}
```

### 7. Analytics Pipeline
```typescript
// Stream to Kinesis Firehose for analytics
import { FirehoseClient, PutRecordCommand } from '@aws-sdk/client-firehose';

const firehose = new FirehoseClient({});

async function streamToAnalytics(record: DynamoDBRecord) {
  const { eventName, dynamodb } = record;
  
  const analyticsRecord = {
    eventType: eventName,
    timestamp: new Date().toISOString(),
    tableName: 'MyTable',
    keys: dynamodb?.Keys,
    newImage: dynamodb?.NewImage,
    oldImage: dynamodb?.OldImage
  };

  await firehose.send(new PutRecordCommand({
    DeliveryStreamName: 'dynamodb-analytics-stream',
    Record: {
      Data: Buffer.from(JSON.stringify(analyticsRecord) + '\n')
    }
  }));
}

// This data flows to S3 -> Athena for SQL analytics
```

### 8. Error Handling & Retry
```typescript
// Lambda with proper error handling
export async function handler(event: DynamoDBStreamEvent) {
  const failedRecords: string[] = [];

  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error('Failed to process record:', record.eventID, error);
      failedRecords.push(record.eventID);
      
      // Option 1: Send to DLQ
      await sendToDeadLetterQueue(record, error);
      
      // Option 2: Throw to retry entire batch (not recommended for large batches)
      // throw error;
    }
  }

  if (failedRecords.length > 0) {
    console.warn(`Failed records: ${failedRecords.length}/${event.Records.length}`);
  }

  // Return partial batch response (Lambda 2021+)
  return {
    batchItemFailures: failedRecords.map(id => ({
      itemIdentifier: id
    }))
  };
}

// Dead letter queue handler
async function sendToDeadLetterQueue(record: DynamoDBRecord, error: any) {
  const sqs = new SQSClient({});
  
  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.DLQ_URL,
    MessageBody: JSON.stringify({
      record,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }));
}
```

### 9. Stream Processing Best Practices

| Practice | Description |
|----------|-------------|
| **Idempotency** | Process same record multiple times safely |
| **Batch size** | Start small (10-100), tune based on processing time |
| **Parallelization** | Use multiple shards for high throughput |
| **Error handling** | Use DLQ for failed records |
| **Monitoring** | Track iterator age, errors, throughput |
| **Ordering** | Records are ordered within shard by sequence number |

---

## Prerequisites
- Completed Section 50-55 (DynamoDB sections)
- AWS Lambda basics
- Docker (for DynamoDB Local)

## Getting Started

```bash
# Start DynamoDB Local
docker-compose -f docker-compose.dynamodb.yml up -d

# Setup demo
cd section-56-dynamodb-streams/demo
cp .env.example .env
pnpm install
pnpm setup
pnpm dev
```

## Key Takeaways

- **Streams** enable real-time reactions to data changes
- **Event types** include INSERT, MODIFY, REMOVE
- **Lambda integration** is the most common processing pattern
- **Idempotency** is crucial for reliable processing
- **Partial batch failures** prevent entire batch retries
