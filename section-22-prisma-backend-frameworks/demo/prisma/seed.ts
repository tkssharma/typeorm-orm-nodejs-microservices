import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice',
      posts: {
        create: [
          { title: 'Hello World', content: 'First post!', published: true },
          { title: 'Draft Post', content: 'Work in progress' },
        ],
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob',
      posts: {
        create: [
          { title: 'Prisma Guide', content: 'How to use Prisma', published: true },
        ],
      },
    },
  });

  console.log('Seeded:', { user1, user2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
