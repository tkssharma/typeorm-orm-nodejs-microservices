import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query'],
});

async function main() {
  console.log('🚀 Prisma Client CRUD Operations Demo\n');

  // Clean up
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // CREATE OPERATIONS
  // ============================================
  console.log('📝 CREATE OPERATIONS\n');

  // 1. Create single record
  console.log('1. Create single user:');
  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      age: 28,
    },
  });
  console.log(user1);

  // 2. Create with nested relation
  console.log('\n2. Create user with posts (nested):');
  const userWithPosts = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      age: 32,
      posts: {
        create: [
          { title: 'First Post', content: 'Hello World!', published: true },
          { title: 'Draft Post', content: 'Work in progress' },
        ],
      },
    },
    include: { posts: true },
  });
  console.log(userWithPosts);

  // 3. Create many records
  console.log('\n3. Create many users (bulk):');
  const bulkResult = await prisma.user.createMany({
    data: [
      { email: 'user1@example.com', name: 'User One', age: 25 },
      { email: 'user2@example.com', name: 'User Two', age: 30 },
      { email: 'user3@example.com', name: 'User Three', age: 35 },
    ],
    skipDuplicates: true,
  });
  console.log(`Created ${bulkResult.count} users`);

  // ============================================
  // READ OPERATIONS
  // ============================================
  console.log('\n📖 READ OPERATIONS\n');

  // 1. Find unique (by unique field)
  console.log('1. findUnique (by email):');
  const foundUser = await prisma.user.findUnique({
    where: { email: 'john@example.com' },
  });
  console.log(foundUser);

  // 2. Find unique or throw
  console.log('\n2. findUniqueOrThrow:');
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'john@example.com' },
    });
    console.log('Found:', user.name);
  } catch (e) {
    console.log('User not found!');
  }

  // 3. Find first
  console.log('\n3. findFirst (with condition):');
  const firstActiveUser = await prisma.user.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(firstActiveUser);

  // 4. Find many with filters
  console.log('\n4. findMany (with filters):');
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { age: { gte: 30 } },
        { name: { contains: 'John' } },
      ],
    },
    orderBy: { name: 'asc' },
  });
  console.log(`Found ${users.length} users`);

  // 5. Select specific fields
  console.log('\n5. Select specific fields:');
  const userNames = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  console.log(userNames);

  // 6. Include relations
  console.log('\n6. Include relations:');
  const usersWithPosts = await prisma.user.findMany({
    include: {
      posts: {
        where: { published: true },
        select: { title: true },
      },
    },
  });
  console.log(JSON.stringify(usersWithPosts, null, 2));

  // 7. Pagination (skip/take)
  console.log('\n7. Pagination:');
  const page1 = await prisma.user.findMany({
    skip: 0,
    take: 2,
    orderBy: { createdAt: 'desc' },
  });
  console.log(`Page 1: ${page1.map(u => u.name).join(', ')}`);

  // 8. Cursor-based pagination
  console.log('\n8. Cursor-based pagination:');
  const firstBatch = await prisma.user.findMany({
    take: 2,
    orderBy: { id: 'asc' },
  });
  if (firstBatch.length > 0) {
    const nextBatch = await prisma.user.findMany({
      take: 2,
      skip: 1,
      cursor: { id: firstBatch[firstBatch.length - 1].id },
      orderBy: { id: 'asc' },
    });
    console.log(`Next batch: ${nextBatch.map(u => u.name).join(', ')}`);
  }

  // ============================================
  // UPDATE OPERATIONS
  // ============================================
  console.log('\n✏️ UPDATE OPERATIONS\n');

  // 1. Update single record
  console.log('1. Update single:');
  const updatedUser = await prisma.user.update({
    where: { email: 'john@example.com' },
    data: { name: 'John Updated', age: 29 },
  });
  console.log(updatedUser);

  // 2. Update many
  console.log('\n2. Update many:');
  const updateMany = await prisma.user.updateMany({
    where: { age: { lt: 30 } },
    data: { isActive: true },
  });
  console.log(`Updated ${updateMany.count} users`);

  // 3. Upsert (update or create)
  console.log('\n3. Upsert:');
  const upserted = await prisma.user.upsert({
    where: { email: 'new@example.com' },
    update: { name: 'Existing User Updated' },
    create: { email: 'new@example.com', name: 'New User' },
  });
  console.log(upserted);

  // 4. Increment/Decrement
  console.log('\n4. Increment post views:');
  const post = await prisma.post.findFirst();
  if (post) {
    const incrementedPost = await prisma.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });
    console.log(`Views: ${incrementedPost.views}`);
  }

  // 5. Update with nested operations
  console.log('\n5. Update with nested create:');
  const userWithNewPost = await prisma.user.update({
    where: { email: 'john@example.com' },
    data: {
      posts: {
        create: { title: 'New Post from Update', published: true },
      },
    },
    include: { posts: true },
  });
  console.log(`User now has ${userWithNewPost.posts.length} posts`);

  // ============================================
  // DELETE OPERATIONS
  // ============================================
  console.log('\n🗑️ DELETE OPERATIONS\n');

  // 1. Delete single
  console.log('1. Delete single:');
  const deletedUser = await prisma.user.delete({
    where: { email: 'new@example.com' },
  });
  console.log(`Deleted: ${deletedUser.name}`);

  // 2. Delete many
  console.log('\n2. Delete many:');
  const deleteMany = await prisma.post.deleteMany({
    where: { published: false },
  });
  console.log(`Deleted ${deleteMany.count} unpublished posts`);

  // ============================================
  // FILTERING EXAMPLES
  // ============================================
  console.log('\n🔍 FILTERING EXAMPLES\n');

  // Various filter operators
  const filterExamples = await prisma.user.findMany({
    where: {
      AND: [
        { isActive: true },
        {
          OR: [
            { name: { startsWith: 'J' } },
            { age: { in: [25, 30, 35] } },
          ],
        },
        { email: { endsWith: '@example.com' } },
        { age: { not: null } },
      ],
    },
  });
  console.log(`Filter result: ${filterExamples.length} users match`);

  // Count
  const count = await prisma.user.count({
    where: { isActive: true },
  });
  console.log(`Active users count: ${count}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
