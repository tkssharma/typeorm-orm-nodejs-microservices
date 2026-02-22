import { PrismaClient } from '@prisma/client';

console.log('Starting Prisma demo...');

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🚀 Prisma ORM - Introduction Demo\n');

  // 1. Create a user
  console.log('📝 Creating a user...');
  const user = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
    },
  });

  const course = await prisma.course.create({
    data: {
      name: 'John Doe',
    },
  });
  console.log('Created course:', course);

  // 2. Read all users
  console.log('\n📖 Reading all users...');
  const users = await prisma.user.findMany();
  console.log('All users:', users);

  // 3. Find a specific user
  console.log('\n🔍 Finding user by email...');
  const foundUser = await prisma.user.findUnique({
    where: { email: 'john@example.com' },
  });
  console.log('Found user:', foundUser);

  // 4. Update the user
  console.log('\n✏️ Updating user...');
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { name: 'John Updated' },
  });
  console.log('Updated user:', updatedUser);

  // 5. Delete the user
  console.log('\n🗑️ Deleting user...');
  await prisma.user.delete({
    where: { id: user.id },
  });
  console.log('User deleted successfully!');

  // 6. Verify deletion
  const remainingUsers = await prisma.user.findMany();
  console.log('\n📊 Remaining users:', remainingUsers.length);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n👋 Disconnected from database');
  });
