import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';
import { docClient, TABLE_NAME } from './client';

async function main() {
  console.log('🚀 AWS SDK v3 DynamoDB Demo\n');
  console.log('═'.repeat(50));

  // ============================================
  // 1. PUT ITEM (Create)
  // ============================================
  console.log('\n📝 PUT ITEM (Create)');
  console.log('─'.repeat(50));

  const userId = uuid().slice(0, 8);
  
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date().toISOString(),
      GSI1PK: `EMAIL#john@example.com`,
      GSI1SK: `USER#${userId}`
    }
  }));
  console.log(`✅ Created user: USER#${userId}`);

  // Create orders for the user
  const orders = [
    { orderId: 'ORD001', total: 150.00, status: 'delivered', date: '2024-01-15' },
    { orderId: 'ORD002', total: 89.99, status: 'pending', date: '2024-01-20' },
    { orderId: 'ORD003', total: 250.00, status: 'shipped', date: '2024-02-01' }
  ];

  for (const order of orders) {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: `ORDER#${order.date}#${order.orderId}`,
        orderId: order.orderId,
        total: order.total,
        status: order.status,
        createdAt: order.date,
        GSI1PK: `STATUS#${order.status}`,
        GSI1SK: `${order.date}#${order.orderId}`
      }
    }));
  }
  console.log(`✅ Created ${orders.length} orders`);

  // ============================================
  // 2. GET ITEM (Read)
  // ============================================
  console.log('\n📖 GET ITEM (Read)');
  console.log('─'.repeat(50));

  const getResult = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE'
    }
  }));
  console.log('User profile:', getResult.Item);

  // ============================================
  // 3. UPDATE ITEM (Atomic Update)
  // ============================================
  console.log('\n✏️ UPDATE ITEM (Atomic Update)');
  console.log('─'.repeat(50));

  const updateResult = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE'
    },
    UpdateExpression: 'SET #name = :name, updatedAt = :updatedAt ADD loginCount :inc',
    ExpressionAttributeNames: {
      '#name': 'name'
    },
    ExpressionAttributeValues: {
      ':name': 'John Smith',
      ':updatedAt': new Date().toISOString(),
      ':inc': 1
    },
    ReturnValues: 'ALL_NEW'
  }));
  console.log('Updated user:', updateResult.Attributes);

  // ============================================
  // 4. QUERY (Efficient - Uses Index)
  // ============================================
  console.log('\n🔍 QUERY (Efficient - Uses Index)');
  console.log('─'.repeat(50));

  // Query all orders for user
  const queryResult = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'ORDER#'
    },
    ScanIndexForward: false // Newest first
  }));
  console.log(`Found ${queryResult.Items?.length} orders:`);
  queryResult.Items?.forEach(item => {
    console.log(`  - ${item.orderId}: $${item.total} (${item.status})`);
  });

  // Query by date range
  console.log('\n📅 Query orders in January 2024:');
  const janOrders = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND SK BETWEEN :start AND :end',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':start': 'ORDER#2024-01-01',
      ':end': 'ORDER#2024-01-31#zzz'
    }
  }));
  console.log(`Found ${janOrders.Items?.length} orders in January`);

  // ============================================
  // 5. QUERY GSI (Secondary Index)
  // ============================================
  console.log('\n📊 QUERY GSI (By Status)');
  console.log('─'.repeat(50));

  const pendingOrders = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :status',
    ExpressionAttributeValues: {
      ':status': 'STATUS#pending'
    }
  }));
  console.log(`Found ${pendingOrders.Items?.length} pending orders`);

  // ============================================
  // 6. CONDITIONAL WRITE
  // ============================================
  console.log('\n⚡ CONDITIONAL WRITE');
  console.log('─'.repeat(50));

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
        name: 'Duplicate User'
      },
      ConditionExpression: 'attribute_not_exists(PK)'
    }));
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log('✅ Correctly prevented duplicate user creation');
    }
  }

  // ============================================
  // 7. DELETE ITEM
  // ============================================
  console.log('\n🗑️ DELETE ITEM');
  console.log('─'.repeat(50));

  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: `ORDER#${orders[0].date}#${orders[0].orderId}`
    }
  }));
  console.log(`✅ Deleted order: ${orders[0].orderId}`);

  // Verify deletion
  const remainingOrders = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'ORDER#'
    }
  }));
  console.log(`Remaining orders: ${remainingOrders.Items?.length}`);

  // ============================================
  // Summary
  // ============================================
  console.log('\n📋 SUMMARY');
  console.log('═'.repeat(50));
  console.log('✅ PutCommand - Create/Replace items');
  console.log('✅ GetCommand - Read single item by key');
  console.log('✅ UpdateCommand - Atomic updates with expressions');
  console.log('✅ QueryCommand - Efficient queries using keys');
  console.log('✅ GSI Query - Query on alternate keys');
  console.log('✅ Conditional Writes - Prevent overwrites');
  console.log('✅ DeleteCommand - Remove items');
}

main().catch(console.error);
