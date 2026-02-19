import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Prisma Migrations Demo\n');

  // Display current data from seeded database
  console.log('📊 Current Database State:\n');

  // Count records
  const counts = {
    users: await prisma.user.count(),
    profiles: await prisma.profile.count(),
    posts: await prisma.post.count(),
    categories: await prisma.category.count(),
  };
  console.log('Record counts:', counts);

  // List users with their roles
  console.log('\n👥 Users:');
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      role: true,
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  users.forEach((u) => {
    console.log(`  - ${u.name} (${u.email}) - ${u.role} - ${u._count.posts} posts`);
  });

  // List categories
  console.log('\n📁 Categories:');
  const categories = await prisma.category.findMany({
    include: { _count: { select: { posts: true } } },
  });
  categories.forEach((c) => {
    console.log(`  - ${c.name} (${c.slug}) - ${c._count.posts} posts`);
  });

  // List published posts
  console.log('\n📝 Published Posts:');
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: { select: { name: true } },
      categories: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  posts.forEach((p) => {
    const cats = p.categories.map((c) => c.name).join(', ');
    console.log(`  - "${p.title}" by ${p.author.name} [${cats}]`);
  });

  console.log('\n✅ Migration demo complete!');
  console.log('\nUseful migration commands:');
  console.log('  pnpm prisma migrate dev --name <name>  # Create new migration');
  console.log('  pnpm prisma migrate deploy             # Apply migrations in production');
  console.log('  pnpm prisma migrate status             # Check migration status');
  console.log('  pnpm prisma migrate reset              # Reset database');
  console.log('  pnpm prisma db seed                    # Run seed script');
  console.log('  pnpm prisma studio                     # Open Prisma Studio');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
