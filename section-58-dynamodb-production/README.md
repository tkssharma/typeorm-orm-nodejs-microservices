# Section 58: DynamoDB Production & Cost Optimization

## Topics Covered

### 1. Capacity Planning
- On-demand vs provisioned capacity
- Auto-scaling configuration
- Reserved capacity for predictable workloads
- Burst capacity and throttling

### 2. Capacity Modes
```typescript
// On-Demand (Pay per request)
// Best for: Unpredictable traffic, new applications
{
  BillingMode: 'PAY_PER_REQUEST'
}

// Provisioned with Auto-Scaling
// Best for: Predictable traffic, cost optimization
{
  BillingMode: 'PROVISIONED',
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 5
  }
}
```

### 3. Auto-Scaling Configuration
```yaml
# CloudFormation / SAM
Resources:
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: MyTable
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5

  WriteScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 100
      MinCapacity: 5
      ResourceId: !Sub table/${DynamoDBTable}
      RoleARN: !GetAtt AutoScalingRole.Arn
      ScalableDimension: dynamodb:table:WriteCapacityUnits
      ServiceNamespace: dynamodb

  WriteScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: WriteAutoScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref WriteScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0  # Target utilization percentage
        ScaleInCooldown: 60
        ScaleOutCooldown: 60
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBWriteCapacityUtilization
```

### 4. Cost Optimization Strategies
```typescript
// 1. Use sparse indexes
// Only items with GSI key attributes are indexed
interface Order {
  PK: string;
  SK: string;
  status: string;
  // GSI only for active orders (sparse)
  GSI1PK?: string;  // Only set when status !== 'COMPLETED'
  GSI1SK?: string;
}

// 2. Project only needed attributes in GSIs
{
  GlobalSecondaryIndexes: [{
    IndexName: 'StatusIndex',
    Projection: {
      ProjectionType: 'INCLUDE',
      NonKeyAttributes: ['orderId', 'total', 'createdAt']
    }
  }]
}

// 3. Use TTL for automatic deletion
{
  TimeToLiveSpecification: {
    AttributeName: 'expiresAt',
    Enabled: true
  }
}

// Set TTL attribute
const item = {
  PK: 'SESSION#abc123',
  SK: 'SESSION#abc123',
  userId: 'user-1',
  expiresAt: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};
```

### 5. Monitoring & Alerts
```typescript
// CloudWatch metrics to monitor
const criticalMetrics = [
  'ConsumedReadCapacityUnits',
  'ConsumedWriteCapacityUnits',
  'ThrottledRequests',
  'SystemErrors',
  'UserErrors',
  'SuccessfulRequestLatency'
];

// CloudWatch alarm for throttling
{
  AlarmName: 'DynamoDB-Throttling',
  MetricName: 'ThrottledRequests',
  Namespace: 'AWS/DynamoDB',
  Statistic: 'Sum',
  Period: 60,
  EvaluationPeriods: 1,
  Threshold: 10,
  ComparisonOperator: 'GreaterThanThreshold',
  Dimensions: [{
    Name: 'TableName',
    Value: 'MyTable'
  }],
  AlarmActions: ['arn:aws:sns:...']
}
```

### 6. Error Handling & Retry
```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Configure retries
const client = new DynamoDBClient({
  maxAttempts: 5,
  retryMode: 'adaptive'  // Adaptive retry with backoff
});

// Handle throttling explicitly
async function writeWithRetry(item: any, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await client.send(new PutCommand({
        TableName: 'MyTable',
        Item: item
      }));
      return;
    } catch (error: any) {
      if (error.name === 'ProvisionedThroughputExceededException') {
        const delay = Math.pow(2, attempt) * 100 + Math.random() * 100;
        console.warn(`Throttled, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 7. Backup & Recovery
```typescript
// On-demand backup
import { CreateBackupCommand, RestoreTableFromBackupCommand } from '@aws-sdk/client-dynamodb';

async function createBackup(tableName: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  const result = await client.send(new CreateBackupCommand({
    TableName: tableName,
    BackupName: `${tableName}-backup-${timestamp}`
  }));
  
  return result.BackupDetails?.BackupArn;
}

async function restoreFromBackup(backupArn: string, newTableName: string) {
  await client.send(new RestoreTableFromBackupCommand({
    BackupArn: backupArn,
    TargetTableName: newTableName
  }));
}

// Point-in-time recovery (PITR)
// Enable in table settings for continuous backups
{
  PointInTimeRecoverySpecification: {
    PointInTimeRecoveryEnabled: true
  }
}
```

### 8. Security Best Practices
```typescript
// IAM policy - least privilege
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/MyTable",
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["USER#${aws:userid}"]
        }
      }
    }
  ]
}

// Encryption at rest (default with AWS-owned key)
{
  SSESpecification: {
    SSEEnabled: true,
    SSEType: 'KMS',
    KMSMasterKeyId: 'alias/my-key'  // Customer-managed key
  }
}

// VPC endpoint for private access
// No data traverses public internet
```

### 9. Global Tables (Multi-Region)
```typescript
// Create global table for multi-region replication
import { CreateGlobalTableCommand } from '@aws-sdk/client-dynamodb';

await client.send(new CreateGlobalTableCommand({
  GlobalTableName: 'MyGlobalTable',
  ReplicationGroup: [
    { RegionName: 'us-east-1' },
    { RegionName: 'eu-west-1' },
    { RegionName: 'ap-southeast-1' }
  ]
}));

// Writes replicate automatically
// Use local endpoints for low latency reads
const localClient = new DynamoDBClient({
  region: 'eu-west-1'  // Closest region to user
});
```

### 10. Cost Estimation
```
On-Demand Pricing (us-east-1):
- Write: $1.25 per million requests
- Read: $0.25 per million requests
- Storage: $0.25 per GB per month

Example: E-commerce API
- 10M writes/month: $12.50
- 50M reads/month: $12.50
- 100GB storage: $25.00
- Total: ~$50/month

Provisioned (with auto-scaling):
- 25 WCU: ~$12.00/month
- 100 RCU: ~$5.00/month
- 100GB storage: $25.00
- Total: ~$42/month (15% savings)

Reserved Capacity (1-year):
- Up to 53% savings on provisioned capacity
```

---

## Prerequisites
- Completed Section 50-57 (DynamoDB sections)
- AWS account with production access
- Understanding of AWS cost model

## Getting Started

```bash
cd section-58-dynamodb-production/demo
cp .env.example .env
pnpm install
pnpm dev
```

## Production Checklist

| Item | Status |
|------|--------|
| ✅ Enable Point-in-Time Recovery | Required |
| ✅ Configure auto-scaling or use on-demand | Required |
| ✅ Set up CloudWatch alarms | Required |
| ✅ Enable encryption at rest | Default (AWS-owned) |
| ✅ Use VPC endpoints for private access | Recommended |
| ✅ Implement exponential backoff | Required |
| ✅ Use TTL for temporary data | Recommended |
| ✅ Review IAM policies | Required |
| ✅ Plan for global tables if multi-region | If needed |

## Key Takeaways

- **Capacity planning** prevents throttling and optimizes cost
- **Auto-scaling** handles traffic variations automatically
- **TTL** reduces storage costs for temporary data
- **PITR** enables recovery from accidental data loss
- **Global tables** provide multi-region availability
- **VPC endpoints** improve security posture
