# Section 57: DynamoDB with Serverless & Lambda

## Topics Covered

### 1. Serverless Architecture with DynamoDB
- Lambda + DynamoDB patterns
- API Gateway integration
- Serverless Framework setup
- Cost optimization

### 2. Serverless Framework Configuration
```yaml
# serverless.yml
service: dynamodb-api

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  environment:
    TABLE_NAME: ${self:service}-${sls:stage}
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
            - dynamodb:BatchWriteItem
            - dynamodb:BatchGetItem
          Resource:
            - !GetAtt DynamoDBTable.Arn
            - !Sub "${DynamoDBTable.Arn}/index/*"

functions:
  createUser:
    handler: src/handlers/users.create
    events:
      - http:
          path: users
          method: post
          cors: true

  getUser:
    handler: src/handlers/users.get
    events:
      - http:
          path: users/{id}
          method: get
          cors: true

  listUsers:
    handler: src/handlers/users.list
    events:
      - http:
          path: users
          method: get
          cors: true

  streamProcessor:
    handler: src/handlers/stream.process
    events:
      - stream:
          type: dynamodb
          arn: !GetAtt DynamoDBTable.StreamArn
          batchSize: 100
          startingPosition: LATEST

resources:
  Resources:
    DynamoDBTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.TABLE_NAME}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: PK
            AttributeType: S
          - AttributeName: SK
            AttributeType: S
          - AttributeName: GSI1PK
            AttributeType: S
          - AttributeName: GSI1SK
            AttributeType: S
        KeySchema:
          - AttributeName: PK
            KeyType: HASH
          - AttributeName: SK
            KeyType: RANGE
        GlobalSecondaryIndexes:
          - IndexName: GSI1
            KeySchema:
              - AttributeName: GSI1PK
                KeyType: HASH
              - AttributeName: GSI1SK
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES

plugins:
  - serverless-esbuild
  - serverless-offline
  - serverless-dynamodb-local

custom:
  esbuild:
    bundle: true
    minify: false
    sourcemap: true
    target: node20
  dynamodb:
    stages:
      - dev
    start:
      port: 8000
      migrate: true
```

### 3. Lambda Handlers
```typescript
// src/handlers/users.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { v4 as uuid } from 'uuid';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

// POST /users
export const create: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const userId = uuid();
    
    const user = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      entityType: 'USER',
      userId,
      email: body.email,
      name: body.name,
      createdAt: new Date().toISOString(),
      GSI1PK: `EMAIL#${body.email}`,
      GSI1SK: `USER#${userId}`
    };

    await client.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: user,
      ConditionExpression: 'attribute_not_exists(PK)'
    }));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...body })
    };
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'User already exists' })
      };
    }
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// GET /users/{id}
export const get: APIGatewayProxyHandler = async (event) => {
  const userId = event.pathParameters?.id;
  
  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'User ID required' })
    };
  }

  const result = await client.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE'
    }
  }));

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'User not found' })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.Item)
  };
};

// GET /users
export const list: APIGatewayProxyHandler = async (event) => {
  const limit = parseInt(event.queryStringParameters?.limit || '20');
  const lastKey = event.queryStringParameters?.cursor;

  const params: any = {
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'begins_with(GSI1PK, :prefix)',
    ExpressionAttributeValues: {
      ':prefix': 'EMAIL#'
    },
    Limit: limit
  };

  if (lastKey) {
    params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
  }

  const result = await client.send(new QueryCommand(params));

  const response: any = {
    items: result.Items,
    count: result.Count
  };

  if (result.LastEvaluatedKey) {
    response.cursor = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response)
  };
};
```

### 4. Cold Start Optimization
```typescript
// Optimize imports - use modular AWS SDK
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Initialize outside handler (reused across invocations)
const ddbClient = new DynamoDBClient({
  maxAttempts: 3
});
const client = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true }
});

// Use provisioned concurrency for critical paths
// serverless.yml:
// functions:
//   criticalFunction:
//     provisionedConcurrency: 5
```

### 5. API Gateway Request Validation
```yaml
# serverless.yml
functions:
  createUser:
    handler: src/handlers/users.create
    events:
      - http:
          path: users
          method: post
          request:
            schemas:
              application/json:
                schema:
                  type: object
                  properties:
                    email:
                      type: string
                      format: email
                    name:
                      type: string
                      minLength: 1
                  required:
                    - email
                    - name
```

### 6. Local Development
```typescript
// src/lib/dynamodb.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isOffline = process.env.IS_OFFLINE === 'true';

const ddbClient = new DynamoDBClient({
  ...(isOffline && {
    endpoint: 'http://localhost:8000',
    region: 'localhost',
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local'
    }
  })
});

export const client = DynamoDBDocumentClient.from(ddbClient);
```

```bash
# Run locally
pnpm sls offline start

# This starts:
# - API Gateway at http://localhost:3000
# - DynamoDB Local at http://localhost:8000
```

### 7. Testing Lambda Functions
```typescript
// tests/handlers/users.test.ts
import { create, get } from '../../src/handlers/users';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

describe('create user', () => {
  it('should create a new user', async () => {
    ddbMock.on(PutCommand).resolves({});

    const event = {
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User'
      })
    } as any;

    const result = await create(event, {} as any, () => {});

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.email).toBe('test@example.com');
  });

  it('should return 409 for duplicate user', async () => {
    const error = new Error('ConditionalCheckFailed');
    error.name = 'ConditionalCheckFailedException';
    ddbMock.on(PutCommand).rejects(error);

    const event = {
      body: JSON.stringify({
        email: 'existing@example.com',
        name: 'Existing'
      })
    } as any;

    const result = await create(event, {} as any, () => {});

    expect(result.statusCode).toBe(409);
  });
});

describe('get user', () => {
  it('should return user by id', async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        userId: '123',
        email: 'test@example.com',
        name: 'Test'
      }
    });

    const event = {
      pathParameters: { id: '123' }
    } as any;

    const result = await get(event, {} as any, () => {});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.userId).toBe('123');
  });

  it('should return 404 for non-existent user', async () => {
    ddbMock.on(GetCommand).resolves({});

    const event = {
      pathParameters: { id: 'nonexistent' }
    } as any;

    const result = await get(event, {} as any, () => {});

    expect(result.statusCode).toBe(404);
  });
});
```

### 8. Deployment & CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to AWS
        run: npx serverless deploy --stage prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

---

## Prerequisites
- Completed Section 50-56 (DynamoDB sections)
- AWS account with credentials
- Serverless Framework basics

## Getting Started

```bash
cd section-57-dynamodb-serverless/demo
cp .env.example .env
pnpm install

# Start local development
pnpm sls dynamodb install
pnpm sls offline start

# Deploy to AWS
pnpm sls deploy --stage dev
```

## Key Takeaways

- **Serverless Framework** simplifies Lambda + DynamoDB deployment
- **Local development** with serverless-offline mimics AWS environment
- **Cold starts** can be mitigated with proper SDK imports
- **Request validation** at API Gateway reduces Lambda invocations
- **Testing** with aws-sdk-client-mock enables unit testing
