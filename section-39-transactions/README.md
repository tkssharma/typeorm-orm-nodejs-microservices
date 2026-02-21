# Section 39: Transactions & Consistency

## Topics Covered

### 1. What are Transactions in MongoDB
- ACID properties in MongoDB
- Transaction support (MongoDB 4.0+)
- Replica set requirement
- Transaction isolation

### 2. Multi-Document Transactions
- Starting a session
- Using transactions with Mongoose
- Committing and aborting
- Automatic retry logic

### 3. ACID in MongoDB
- Atomicity at document level
- Consistency with validation
- Isolation levels
- Durability with write concerns

### 4. When to Use Transactions
- Financial operations
- Order processing
- Inventory management
- Multi-collection updates

### 5. Performance Tradeoffs
- Transaction overhead
- Lock contention
- Timeout settings
- Alternatives to transactions

## Code Examples

### Basic Transaction
```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Deduct from sender
  await Account.updateOne(
    { _id: senderId },
    { $inc: { balance: -amount } },
    { session }
  );

  // Add to receiver
  await Account.updateOne(
    { _id: receiverId },
    { $inc: { balance: amount } },
    { session }
  );

  // Create transaction record
  await Transaction.create([{
    from: senderId,
    to: receiverId,
    amount,
    type: 'transfer'
  }], { session });

  await session.commitTransaction();
  console.log('Transfer successful');
} catch (error) {
  await session.abortTransaction();
  console.error('Transfer failed:', error);
  throw error;
} finally {
  session.endSession();
}
```

### With Mongoose Helper
```javascript
await mongoose.connection.transaction(async (session) => {
  await Order.create([{ items, total }], { session });
  await Inventory.updateMany(
    { _id: { $in: itemIds } },
    { $inc: { quantity: -1 } },
    { session }
  );
});
```

## Demo Project
```bash
cd section-39-transactions/demo
cp .env.example .env
pnpm install
pnpm dev
```
