import {
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  waitUntilTableExists
} from '@aws-sdk/client-dynamodb';
import { dynamoDBClient, TABLE_NAME } from './client';

async function setupTable() {
  console.log('🔧 Setting up DynamoDB table...\n');

  // Check if table exists
  try {
    await dynamoDBClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`Table "${TABLE_NAME}" already exists. Deleting...`);
    await dynamoDBClient.send(new DeleteTableCommand({ TableName: TABLE_NAME }));
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error: any) {
    if (error.name !== 'ResourceNotFoundException') {
      throw error;
    }
  }

  // Create table with GSI
  console.log(`Creating table "${TABLE_NAME}"...`);
  
  await dynamoDBClient.send(new CreateTableCommand({
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' }
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
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  }));

  // Wait for table to be active
  await waitUntilTableExists(
    { client: dynamoDBClient, maxWaitTime: 60 },
    { TableName: TABLE_NAME }
  );

  console.log(`✅ Table "${TABLE_NAME}" created successfully!`);
  console.log('\nTable structure:');
  console.log('  PK (Partition Key): String');
  console.log('  SK (Sort Key): String');
  console.log('  GSI1: GSI1PK + GSI1SK');
}

setupTable().catch(console.error);
