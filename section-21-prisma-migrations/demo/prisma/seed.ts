import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clean existing data (in correct order due to foreign keys)
  console.log('Cleaning existing data...');
  await prisma.post.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create categories
  console.log('Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Technology', slug: 'technology' } }),
    prisma.category.create({ data: { name: 'Programming', slug: 'programming' } }),
    prisma.category.create({ data: { name: 'Database', slug: 'database' } }),
    prisma.category.create({ data: { name: 'Web Development', slug: 'web-development' } }),
    prisma.category.create({ data: { name: 'DevOps', slug: 'devops' } }),
  ]);
  console.log(`Created ${categories.length} categories`);

  // Create admin user
  console.log('Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: Role.ADMIN,
      profile: {
        create: {
          bio: 'System administrator',
          avatar: 'https://example.com/admin.jpg',
        },
      },
      posts: {
        create: [
          {
            title: 'Welcome to our platform',
            content: 'This is the first post on our platform!',
            published: true,
            categories: {
              connect: [{ id: categories[0].id }],
            },
          },
        ],
      },
    },
    include: { profile: true, posts: true },
  });
  console.log(`Created admin: ${admin.email}`);

  // Create moderator
  console.log('Creating moderator...');
  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@example.com',
      name: 'Moderator User',
      role: Role.MODERATOR,
      profile: {
        create: {
          bio: 'Content moderator',
        },
      },
    },
  });
  console.log(`Created moderator: ${moderator.email}`);

  // Create regular users with posts
  console.log('Creating regular users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john@example.com',
        name: 'John Doe',
        role: Role.USER,
        profile: {
          create: {
            bio: 'Full-stack developer',
            website: 'https://johndoe.dev',
          },
        },
        posts: {
          create: [
            {
              title: 'Getting Started with Prisma',
              content: 'Prisma is a next-generation ORM for Node.js and TypeScript...',
              published: true,
              categories: {
                connect: [{ id: categories[1].id }, { id: categories[2].id }],
              },
            },
            {
              title: 'Database Migrations Best Practices',
              content: 'In this post, we will explore best practices for database migrations...',
              published: true,
              categories: {
                connect: [{ id: categories[2].id }],
              },
            },
            {
              title: 'Draft: Advanced TypeScript Tips',
              content: 'Work in progress...',
              published: false,
            },
          ],
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane@example.com',
        name: 'Jane Smith',
        role: Role.USER,
        profile: {
          create: {
            bio: 'Backend engineer',
            website: 'https://janesmith.io',
          },
        },
        posts: {
          create: [
            {
              title: 'Building REST APIs with Express',
              content: 'Learn how to build robust REST APIs using Express.js...',
              published: true,
              categories: {
                connect: [{ id: categories[3].id }],
              },
            },
            {
              title: 'Docker for Developers',
              content: 'A comprehensive guide to Docker for application developers...',
              published: true,
              categories: {
                connect: [{ id: categories[4].id }],
              },
            },
          ],
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        name: 'Bob Wilson',
        role: Role.USER,
        profile: {
          create: {
            bio: 'DevOps engineer',
          },
        },
      },
    }),
  ]);
  console.log(`Created ${users.length} regular users`);

  // Summary
  console.log('\n✅ Seeding completed!');
  console.log('-------------------');
  const userCount = await prisma.user.count();
  const postCount = await prisma.post.count();
  const categoryCount = await prisma.category.count();
  console.log(`Users: ${userCount}`);
  console.log(`Posts: ${postCount}`);
  console.log(`Categories: ${categoryCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
