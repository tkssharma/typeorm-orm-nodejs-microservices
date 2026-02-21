import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { 
  UserEmbedded, 
  Author, Book, 
  Customer, Order,
  Student, Course 
} from './models';

dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schema_design_demo');
    console.log('✅ Connected to MongoDB\n');

    // Clear all collections
    await Promise.all([
      UserEmbedded.deleteMany({}),
      Author.deleteMany({}),
      Book.deleteMany({}),
      Customer.deleteMany({}),
      Order.deleteMany({}),
      Student.deleteMany({}),
      Course.deleteMany({})
    ]);

    // ============================================
    // 1. EMBEDDED DOCUMENTS DEMO
    // ============================================
    console.log('📦 EMBEDDED DOCUMENTS (One-to-Few)');
    console.log('─'.repeat(50));

    const userWithAddresses = await UserEmbedded.create({
      name: 'John Doe',
      email: 'john@example.com',
      addresses: [
        { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001' },
        { street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', zipCode: '90001' }
      ]
    });
    console.log(`Created user with ${userWithAddresses.addresses.length} embedded addresses`);
    console.log(`  Home: ${userWithAddresses.addresses[0].city}, ${userWithAddresses.addresses[0].state}`);
    console.log(`  Work: ${userWithAddresses.addresses[1].city}, ${userWithAddresses.addresses[1].state}`);

    // Add another address
    userWithAddresses.addresses.push({
      street: '789 Pine Rd', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'USA'
    });
    await userWithAddresses.save();
    console.log(`Added address, now has ${userWithAddresses.addresses.length} addresses\n`);

    // ============================================
    // 2. REFERENCED DOCUMENTS DEMO
    // ============================================
    console.log('🔗 REFERENCED DOCUMENTS (One-to-Many)');
    console.log('─'.repeat(50));

    const author = await Author.create({
      name: 'George Orwell',
      email: 'george@example.com',
      bio: 'English novelist and essayist'
    });

    const books = await Book.insertMany([
      { title: '1984', isbn: '978-0451524935', author: author._id, genres: ['Dystopian', 'Political'], publishedYear: 1949 },
      { title: 'Animal Farm', isbn: '978-0451526342', author: author._id, genres: ['Satire', 'Allegory'], publishedYear: 1945 }
    ]);
    console.log(`Created author: ${author.name}`);
    console.log(`Created ${books.length} books referencing the author`);

    // Populate to get author details
    const bookWithAuthor = await Book.findOne({ title: '1984' }).populate('author');
    console.log(`Book "${bookWithAuthor?.title}" by ${(bookWithAuthor?.author as any)?.name}\n`);

    // ============================================
    // 3. HYBRID APPROACH DEMO
    // ============================================
    console.log('🔀 HYBRID APPROACH (Referenced + Embedded)');
    console.log('─'.repeat(50));

    const customer = await Customer.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-0123'
    });

    const order = await Order.create({
      orderNumber: 'ORD-001',
      customer: customer._id, // Referenced
      items: [ // Embedded (denormalized for fast access)
        { productId: new mongoose.Types.ObjectId(), productName: 'Laptop', price: 999.99, quantity: 1 },
        { productId: new mongoose.Types.ObjectId(), productName: 'Mouse', price: 29.99, quantity: 2 }
      ],
      total: 1059.97,
      status: 'pending'
    });

    console.log(`Created order ${order.orderNumber} for customer ref: ${order.customer}`);
    console.log(`  Items (embedded): ${order.items.map(i => i.productName).join(', ')}`);
    console.log(`  Total: $${order.total}`);

    // Populate customer
    const orderWithCustomer = await Order.findById(order._id).populate('customer');
    console.log(`  Customer (populated): ${(orderWithCustomer?.customer as any)?.name}\n`);

    // ============================================
    // 4. MANY-TO-MANY DEMO
    // ============================================
    console.log('🔄 MANY-TO-MANY RELATIONSHIPS');
    console.log('─'.repeat(50));

    // Create courses
    const [mathCourse, physicsCourse, csCourse] = await Course.insertMany([
      { name: 'Mathematics 101', code: 'MATH101', credits: 3, students: [] },
      { name: 'Physics 101', code: 'PHYS101', credits: 4, students: [] },
      { name: 'Computer Science 101', code: 'CS101', credits: 3, students: [] }
    ]);

    // Create students
    const [alice, bob] = await Student.insertMany([
      { name: 'Alice Johnson', studentId: 'STU001', enrolledCourses: [] },
      { name: 'Bob Wilson', studentId: 'STU002', enrolledCourses: [] }
    ]);

    // Enroll students in courses (update both sides)
    // Alice enrolls in Math and CS
    await Student.updateOne(
      { _id: alice._id },
      { $push: { enrolledCourses: { $each: [mathCourse._id, csCourse._id] } } }
    );
    await Course.updateMany(
      { _id: { $in: [mathCourse._id, csCourse._id] } },
      { $push: { students: alice._id } }
    );

    // Bob enrolls in all three
    await Student.updateOne(
      { _id: bob._id },
      { $push: { enrolledCourses: { $each: [mathCourse._id, physicsCourse._id, csCourse._id] } } }
    );
    await Course.updateMany(
      { _id: { $in: [mathCourse._id, physicsCourse._id, csCourse._id] } },
      { $push: { students: bob._id } }
    );

    // Query with populate
    const aliceWithCourses = await Student.findById(alice._id).populate('enrolledCourses');
    console.log(`${aliceWithCourses?.name} is enrolled in:`);
    (aliceWithCourses?.enrolledCourses as any[])?.forEach(c => {
      console.log(`  - ${c.name} (${c.code})`);
    });

    const csWithStudents = await Course.findById(csCourse._id).populate('students');
    console.log(`\n${csWithStudents?.name} has students:`);
    (csWithStudents?.students as any[])?.forEach(s => {
      console.log(`  - ${s.name} (${s.studentId})`);
    });

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n📊 SCHEMA DESIGN PATTERNS SUMMARY:');
    console.log('─'.repeat(50));
    console.log('• Embedded: Fast reads, atomic updates, good for 1-to-few');
    console.log('• Referenced: Flexible, avoids duplication, good for 1-to-many');
    console.log('• Hybrid: Best of both, denormalize for reads');
    console.log('• Many-to-Many: Two-way references or join collection');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

main();
