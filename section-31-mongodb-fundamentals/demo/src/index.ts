import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mongodb_fundamentals';

interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
}

async function main() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection<User>('users');

    // Clear existing data
    await usersCollection.deleteMany({});
    console.log('🗑️  Cleared existing data\n');

    // ============================================
    // CREATE Operations
    // ============================================
    console.log('📝 CREATE Operations:');
    console.log('─'.repeat(40));

    // insertOne - Insert single document
    const insertOneResult = await usersCollection.insertOne({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      isActive: true,
      createdAt: new Date()
    });
    console.log(`insertOne: Inserted ID: ${insertOneResult.insertedId}`);

    // insertMany - Insert multiple documents
    const insertManyResult = await usersCollection.insertMany([
      { name: 'Jane Smith', email: 'jane@example.com', age: 25, isActive: true, createdAt: new Date() },
      { name: 'Bob Wilson', email: 'bob@example.com', age: 35, isActive: false, createdAt: new Date() },
      { name: 'Alice Brown', email: 'alice@example.com', age: 28, isActive: true, createdAt: new Date() },
      { name: 'Charlie Davis', email: 'charlie@example.com', age: 42, isActive: true, createdAt: new Date() }
    ]);
    console.log(`insertMany: Inserted ${insertManyResult.insertedCount} documents\n`);

    // ============================================
    // READ Operations
    // ============================================
    console.log('📖 READ Operations:');
    console.log('─'.repeat(40));

    // find - Get all documents
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`find({}): Found ${allUsers.length} users`);

    // findOne - Get single document
    const oneUser = await usersCollection.findOne({ email: 'john@example.com' });
    console.log(`findOne: Found user: ${oneUser?.name}`);

    // find with filter
    const activeUsers = await usersCollection.find({ isActive: true }).toArray();
    console.log(`find({ isActive: true }): Found ${activeUsers.length} active users`);

    // find with comparison operators
    const olderUsers = await usersCollection.find({ age: { $gte: 30 } }).toArray();
    console.log(`find({ age: { $gte: 30 } }): Found ${olderUsers.length} users age >= 30`);

    // find with projection (select specific fields)
    const namesOnly = await usersCollection
      .find({})
      .project({ name: 1, email: 1, _id: 0 })
      .toArray();
    console.log(`find with projection: ${JSON.stringify(namesOnly[0])}`);

    // find with sort and limit
    const sortedUsers = await usersCollection
      .find({})
      .sort({ age: -1 })
      .limit(2)
      .toArray();
    console.log(`find with sort & limit: Top 2 oldest: ${sortedUsers.map(u => u.name).join(', ')}`);

    // count documents
    const count = await usersCollection.countDocuments({ isActive: true });
    console.log(`countDocuments: ${count} active users\n`);

    // ============================================
    // UPDATE Operations
    // ============================================
    console.log('✏️  UPDATE Operations:');
    console.log('─'.repeat(40));

    // updateOne - Update single document
    const updateOneResult = await usersCollection.updateOne(
      { email: 'john@example.com' },
      { $set: { age: 31 }, $currentDate: { updatedAt: true } }
    );
    console.log(`updateOne: Modified ${updateOneResult.modifiedCount} document`);

    // updateMany - Update multiple documents
    const updateManyResult = await usersCollection.updateMany(
      { isActive: true },
      { $inc: { age: 1 } }
    );
    console.log(`updateMany: Modified ${updateManyResult.modifiedCount} documents`);

    // findOneAndUpdate - Update and return document
    const updatedUser = await usersCollection.findOneAndUpdate(
      { email: 'jane@example.com' },
      { $set: { name: 'Jane Wilson' } },
      { returnDocument: 'after' }
    );
    console.log(`findOneAndUpdate: Updated name to: ${updatedUser?.name}`);

    // upsert - Update or insert if not exists
    const upsertResult = await usersCollection.updateOne(
      { email: 'new@example.com' },
      { $set: { name: 'New User', age: 22, isActive: true, createdAt: new Date() } },
      { upsert: true }
    );
    console.log(`upsert: Upserted ID: ${upsertResult.upsertedId}\n`);

    // ============================================
    // DELETE Operations
    // ============================================
    console.log('🗑️  DELETE Operations:');
    console.log('─'.repeat(40));

    // deleteOne - Delete single document
    const deleteOneResult = await usersCollection.deleteOne({ email: 'new@example.com' });
    console.log(`deleteOne: Deleted ${deleteOneResult.deletedCount} document`);

    // deleteMany - Delete multiple documents
    const deleteManyResult = await usersCollection.deleteMany({ isActive: false });
    console.log(`deleteMany: Deleted ${deleteManyResult.deletedCount} inactive users`);

    // findOneAndDelete - Delete and return document
    const deletedUser = await usersCollection.findOneAndDelete({ email: 'charlie@example.com' });
    console.log(`findOneAndDelete: Deleted user: ${deletedUser?.name}\n`);

    // ============================================
    // Query Operators Examples
    // ============================================
    console.log('🔍 Query Operators:');
    console.log('─'.repeat(40));

    // Re-insert some data for demo
    await usersCollection.insertMany([
      { name: 'Test User 1', email: 'test1@example.com', age: 20, isActive: true, createdAt: new Date() },
      { name: 'Test User 2', email: 'test2@example.com', age: 25, isActive: false, createdAt: new Date() },
      { name: 'Test User 3', email: 'test3@example.com', age: 30, isActive: true, createdAt: new Date() }
    ]);

    // $in operator
    const inResult = await usersCollection.find({ age: { $in: [25, 30] } }).toArray();
    console.log(`$in [25, 30]: Found ${inResult.length} users`);

    // $and operator (implicit)
    const andResult = await usersCollection.find({ age: { $gte: 25 }, isActive: true }).toArray();
    console.log(`$and (implicit): age >= 25 AND isActive: ${andResult.length} users`);

    // $or operator
    const orResult = await usersCollection.find({
      $or: [{ age: { $lt: 22 } }, { age: { $gt: 28 } }]
    }).toArray();
    console.log(`$or: age < 22 OR age > 28: ${orResult.length} users`);

    // $regex operator
    const regexResult = await usersCollection.find({ name: { $regex: /^Test/, $options: 'i' } }).toArray();
    console.log(`$regex: Names starting with 'Test': ${regexResult.length} users`);

    // Final count
    const finalCount = await usersCollection.countDocuments();
    console.log(`\n📊 Final document count: ${finalCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Connection closed');
  }
}

main();
