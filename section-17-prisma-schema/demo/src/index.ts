import { PrismaClient, Role, Status, Priority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗄️ Prisma Schema & Data Modeling Demo\n');

  // Clean up existing data
  await prisma.task.deleteMany();
  await prisma.post.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();

  // ============================================
  // 1. Create User with all field types
  // ============================================
  console.log('👤 Creating user with various data types...');
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      username: 'demouser',
      name: 'Demo User',
      age: 28,
      balance: 1500.50,
      isActive: true,
      role: Role.ADMIN,
      metadata: {
        preferences: { theme: 'dark', notifications: true },
        lastLogin: new Date().toISOString(),
      },
    },
  });
  console.log('Created user:', user);

  // ============================================
  // 2. Create Profile (One-to-One)
  // ============================================
  console.log('\n📝 Creating profile...');
  const profile = await prisma.profile.create({
    data: {
      bio: 'Full-stack developer passionate about TypeScript and databases.',
      avatar: 'https://example.com/avatar.jpg',
      website: 'https://example.com',
      birthDate: new Date('1995-06-15'),
      userId: user.id,
    },
  });
  console.log('Created profile:', profile);

  // ============================================
  // 3. Create Posts with Enums
  // ============================================
  console.log('\n📰 Creating posts with different statuses...');
  const posts = await prisma.post.createMany({
    data: [
      {
        title: 'Getting Started with Prisma',
        slug: 'getting-started-prisma',
        content: 'Prisma is a next-generation ORM...',
        excerpt: 'Learn the basics of Prisma ORM',
        status: Status.PUBLISHED,
        views: 150,
        likes: 25,
        rating: 4.8,
        publishedAt: new Date(),
        authorId: user.id,
      },
      {
        title: 'Advanced Prisma Patterns',
        slug: 'advanced-prisma-patterns',
        content: 'In this post we explore advanced...',
        status: Status.DRAFT,
        authorId: user.id,
      },
      {
        title: 'Old Tutorial',
        slug: 'old-tutorial',
        content: 'This content is archived...',
        status: Status.ARCHIVED,
        authorId: user.id,
      },
    ],
  });
  console.log('Created posts:', posts);

  // ============================================
  // 4. Create Tasks with Priority Enum
  // ============================================
  console.log('\n✅ Creating tasks with priorities...');
  const tasks = await prisma.task.createMany({
    data: [
      {
        title: 'Fix critical bug',
        description: 'Users cannot login',
        priority: Priority.URGENT,
        dueDate: new Date('2024-02-20'),
        userId: user.id,
        order: 1,
      },
      {
        title: 'Write documentation',
        priority: Priority.MEDIUM,
        userId: user.id,
        order: 2,
      },
      {
        title: 'Refactor code',
        priority: Priority.LOW,
        userId: user.id,
        order: 3,
      },
    ],
  });
  console.log('Created tasks:', tasks);

  // ============================================
  // 5. Create Product with Decimal/BigInt
  // ============================================
  console.log('\n📦 Creating product...');
  const product = await prisma.product.create({
    data: {
      sku: 'PROD-001',
      name: 'Wireless Keyboard',
      description: 'Ergonomic wireless keyboard',
      price: 79.99,
      cost: 45.00,
      quantity: 100,
      barcode: BigInt('1234567890123'),
      weight: 0.45,
      isAvailable: true,
    },
  });
  console.log('Created product:', { ...product, barcode: product.barcode?.toString() });

  // ============================================
  // 6. Query with Relations
  // ============================================
  console.log('\n🔗 Querying user with all relations...');
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      profile: true,
      posts: {
        select: { title: true, status: true },
      },
      tasks: {
        select: { title: true, priority: true },
        orderBy: { order: 'asc' },
      },
    },
  });
  console.log('Full user data:', JSON.stringify(fullUser, null, 2));

  // ============================================
  // 7. Filter by Enum
  // ============================================
  console.log('\n🔍 Filtering by status enum...');
  const publishedPosts = await prisma.post.findMany({
    where: { status: Status.PUBLISHED },
  });
  console.log('Published posts:', publishedPosts.map(p => p.title));

  const urgentTasks = await prisma.task.findMany({
    where: { priority: Priority.URGENT },
  });
  console.log('Urgent tasks:', urgentTasks.map(t => t.title));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
