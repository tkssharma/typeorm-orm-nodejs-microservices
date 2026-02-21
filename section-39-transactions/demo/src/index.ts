import mongoose, { Schema, ClientSession } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Account Schema
const accountSchema = new Schema({
  owner: { type: String, required: true },
  balance: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' }
}, { timestamps: true });

const Account = mongoose.model('Account', accountSchema);

// Transaction Log Schema
const transactionLogSchema = new Schema({
  fromAccount: { type: Schema.Types.ObjectId, ref: 'Account' },
  toAccount: { type: Schema.Types.ObjectId, ref: 'Account' },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['transfer', 'deposit', 'withdrawal'] },
  status: { type: String, enum: ['pending', 'completed', 'failed'] },
  error: String
}, { timestamps: true });

const TransactionLog = mongoose.model('TransactionLog', transactionLogSchema);

// Transfer money with transaction
async function transferMoney(
  fromAccountId: string,
  toAccountId: string,
  amount: number
): Promise<boolean> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    console.log(`\n💸 Starting transfer of $${amount}...`);

    // Find accounts within transaction
    const fromAccount = await Account.findById(fromAccountId).session(session);
    const toAccount = await Account.findById(toAccountId).session(session);

    if (!fromAccount || !toAccount) {
      throw new Error('Account not found');
    }

    if (fromAccount.balance < amount) {
      throw new Error(`Insufficient funds. Balance: $${fromAccount.balance}, Required: $${amount}`);
    }

    // Deduct from sender
    await Account.updateOne(
      { _id: fromAccountId },
      { $inc: { balance: -amount } },
      { session }
    );

    // Add to receiver
    await Account.updateOne(
      { _id: toAccountId },
      { $inc: { balance: amount } },
      { session }
    );

    // Log the transaction
    await TransactionLog.create([{
      fromAccount: fromAccountId,
      toAccount: toAccountId,
      amount,
      type: 'transfer',
      status: 'completed'
    }], { session });

    // Commit the transaction
    await session.commitTransaction();
    console.log(`✅ Transfer successful!`);
    console.log(`   ${fromAccount.owner}: $${fromAccount.balance} -> $${fromAccount.balance - amount}`);
    console.log(`   ${toAccount.owner}: $${toAccount.balance} -> $${toAccount.balance + amount}`);
    
    return true;
  } catch (error: any) {
    // Abort transaction on error
    await session.abortTransaction();
    console.log(`❌ Transfer failed: ${error.message}`);
    
    // Log failed transaction
    await TransactionLog.create({
      fromAccount: fromAccountId,
      toAccount: toAccountId,
      amount,
      type: 'transfer',
      status: 'failed',
      error: error.message
    });
    
    return false;
  } finally {
    session.endSession();
  }
}

// Batch operation with transaction
async function batchTransfer(
  transfers: Array<{ from: string; to: string; amount: number }>
): Promise<boolean> {
  const session = await mongoose.startSession();
  
  try {
    // Use withTransaction helper
    await session.withTransaction(async () => {
      for (const transfer of transfers) {
        const fromAccount = await Account.findById(transfer.from).session(session);
        
        if (!fromAccount || fromAccount.balance < transfer.amount) {
          throw new Error(`Transfer failed for ${transfer.from}`);
        }

        await Account.updateOne(
          { _id: transfer.from },
          { $inc: { balance: -transfer.amount } },
          { session }
        );

        await Account.updateOne(
          { _id: transfer.to },
          { $inc: { balance: transfer.amount } },
          { session }
        );
      }
    });

    console.log(`✅ Batch transfer completed (${transfers.length} transfers)`);
    return true;
  } catch (error: any) {
    console.log(`❌ Batch transfer failed: ${error.message}`);
    return false;
  } finally {
    session.endSession();
  }
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/transactions_demo');
    console.log('✅ Connected to MongoDB');
    console.log('⚠️  Note: Transactions require a replica set\n');

    // Clear data
    await Account.deleteMany({});
    await TransactionLog.deleteMany({});

    // Create accounts
    const [alice, bob, charlie] = await Account.insertMany([
      { owner: 'Alice', balance: 1000 },
      { owner: 'Bob', balance: 500 },
      { owner: 'Charlie', balance: 200 }
    ]);

    console.log('📊 Initial Balances:');
    console.log(`   Alice: $${alice.balance}`);
    console.log(`   Bob: $${bob.balance}`);
    console.log(`   Charlie: $${charlie.balance}`);

    // Test 1: Successful transfer
    console.log('\n─'.repeat(25));
    console.log('TEST 1: Successful Transfer');
    await transferMoney(alice._id.toString(), bob._id.toString(), 200);

    // Test 2: Failed transfer (insufficient funds)
    console.log('\n─'.repeat(25));
    console.log('TEST 2: Failed Transfer (Insufficient Funds)');
    await transferMoney(charlie._id.toString(), alice._id.toString(), 500);

    // Show final balances
    const finalAccounts = await Account.find({}).sort({ owner: 1 });
    console.log('\n📊 Final Balances:');
    finalAccounts.forEach(acc => {
      console.log(`   ${acc.owner}: $${acc.balance}`);
    });

    // Show transaction log
    const logs = await TransactionLog.find({}).populate('fromAccount toAccount');
    console.log('\n📝 Transaction Log:');
    logs.forEach(log => {
      const from = (log.fromAccount as any)?.owner || 'N/A';
      const to = (log.toAccount as any)?.owner || 'N/A';
      console.log(`   ${from} -> ${to}: $${log.amount} [${log.status}]`);
    });

    console.log('\n💡 KEY POINTS:');
    console.log('   • Transactions ensure all-or-nothing operations');
    console.log('   • Require MongoDB replica set (4.0+)');
    console.log('   • Use session.startTransaction() or withTransaction()');
    console.log('   • Always handle errors and abort on failure');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

main();
