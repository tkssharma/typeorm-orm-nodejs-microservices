import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, UserRole } from './models/User';

dotenv.config();

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mongoose_essentials');
    console.log('✅ Connected to MongoDB');

    // Clear existing data for demo
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // CREATE - Insert single document
    console.log('\n📝 CREATE Operations:');
    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      role: UserRole.USER,
      tags: ['developer', 'nodejs']
    });
    console.log('Created user:', user1.name);

    // CREATE - Insert multiple documents
    const users = await User.insertMany([
      { name: 'Jane Smith', email: 'jane@example.com', age: 25, role: UserRole.ADMIN },
      { name: 'Bob Wilson', email: 'bob@example.com', age: 35, role: UserRole.MODERATOR },
      { name: 'Alice Brown', email: 'alice@example.com', age: 28, isActive: false }
    ]);
    console.log(`Created ${users.length} more users`);

    // READ - Find all
    console.log('\n📖 READ Operations:');
    const allUsers = await User.find();
    console.log(`Total users: ${allUsers.length}`);

    // READ - Find with conditions
    const activeUsers = await User.find({ isActive: true });
    console.log(`Active users: ${activeUsers.length}`);

    // READ - Find one
    const admin = await User.findOne({ role: UserRole.ADMIN });
    console.log(`Admin user: ${admin?.name}`);

    // READ - Find by ID
    const foundUser = await User.findById(user1._id);
    console.log(`Found by ID: ${foundUser?.name}`);

    // READ - With query helpers
    const sortedUsers = await User.find()
      .select('name email role')
      .sort({ name: 1 })
      .limit(3);
    console.log('Top 3 users (sorted):', sortedUsers.map(u => u.name));

    // UPDATE - Update one
    console.log('\n✏️  UPDATE Operations:');
    await User.updateOne(
      { email: 'john@example.com' },
      { $set: { age: 31 }, $push: { tags: 'senior' } }
    );
    console.log('Updated John\'s age and tags');

    // UPDATE - Find and update (returns updated doc)
    const updatedUser = await User.findOneAndUpdate(
      { email: 'jane@example.com' },
      { age: 26 },
      { new: true }
    );
    console.log(`Jane's new age: ${updatedUser?.age}`);

    // DELETE - Delete one
    console.log('\n🗑️  DELETE Operations:');
    const deleteResult = await User.deleteOne({ email: 'bob@example.com' });
    console.log(`Deleted ${deleteResult.deletedCount} user(s)`);

    // Final count
    const finalCount = await User.countDocuments();
    console.log(`\n📊 Final user count: ${finalCount}`);

    // Show all remaining users
    const remaining = await User.find().lean();
    console.log('\nRemaining users:');
    remaining.forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

main();
