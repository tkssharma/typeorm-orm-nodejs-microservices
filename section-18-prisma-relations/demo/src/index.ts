import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔗 Prisma Relations Demo\n');

  // Clean up
  await prisma.postLike.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // 1. ONE-TO-ONE: Create User with Profile
  // ============================================
  console.log('1️⃣ Creating User with Profile (One-to-One)...');
  const userWithProfile = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      profile: {
        create: {
          bio: 'Full-stack developer',
          avatar: 'https://example.com/john.jpg',
          website: 'https://johndoe.dev',
        },
      },
    },
    include: { profile: true },
  });
  console.log('User with profile:', userWithProfile);

  // ============================================
  // 2. ONE-TO-MANY: Create User with Posts
  // ============================================
  console.log('\n2️⃣ Creating User with Posts (One-to-Many)...');
  const userWithPosts = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      posts: {
        create: [
          { title: 'First Post', content: 'Hello World!', published: true },
          { title: 'Second Post', content: 'Learning Prisma', published: true },
          { title: 'Draft Post', content: 'Work in progress', published: false },
        ],
      },
    },
    include: { posts: true },
  });
  console.log('User with posts:', userWithPosts);

  // ============================================
  // 3. MANY-TO-MANY: Create Tags and connect
  // ============================================
  console.log('\n3️⃣ Creating Tags (Many-to-Many)...');
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'typescript' } }),
    prisma.tag.create({ data: { name: 'prisma' } }),
    prisma.tag.create({ data: { name: 'nodejs' } }),
  ]);
  console.log('Created tags:', tags.map(t => t.name));

  // Connect tags to post
  const post = userWithPosts.posts[0];
  await prisma.postTag.createMany({
    data: [
      { postId: post.id, tagId: tags[0].id },
      { postId: post.id, tagId: tags[1].id },
    ],
  });

  const postWithTags = await prisma.post.findUnique({
    where: { id: post.id },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });
  console.log('Post with tags:', postWithTags?.tags.map(t => t.tag.name));

  // ============================================
  // 4. NESTED COMMENTS: Self-referencing
  // ============================================
  console.log('\n4️⃣ Creating Comments with Replies (Self-referencing)...');
  const parentComment = await prisma.comment.create({
    data: {
      content: 'Great post!',
      postId: post.id,
      authorId: userWithProfile.id,
    },
  });

  const replyComment = await prisma.comment.create({
    data: {
      content: 'Thanks for the feedback!',
      postId: post.id,
      authorId: userWithPosts.id,
      parentId: parentComment.id,
    },
  });

  const commentWithReplies = await prisma.comment.findUnique({
    where: { id: parentComment.id },
    include: {
      replies: {
        include: { author: { select: { name: true } } },
      },
    },
  });
  console.log('Comment with replies:', commentWithReplies);

  // ============================================
  // 5. SELF-REFERENCING: User follows User
  // ============================================
  console.log('\n5️⃣ Creating Follow relationships (Self-referencing)...');
  await prisma.follow.create({
    data: {
      followerId: userWithProfile.id,
      followingId: userWithPosts.id,
    },
  });

  const userWithFollows = await prisma.user.findUnique({
    where: { id: userWithProfile.id },
    include: {
      following: {
        include: { following: { select: { name: true } } },
      },
    },
  });
  console.log('User following:', userWithFollows?.following.map(f => f.following.name));

  // ============================================
  // 6. CATEGORY TREE: Hierarchical data
  // ============================================
  console.log('\n6️⃣ Creating Category hierarchy (Tree structure)...');
  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      children: {
        create: [
          {
            name: 'Computers',
            children: {
              create: [
                { name: 'Laptops' },
                { name: 'Desktops' },
              ],
            },
          },
          {
            name: 'Phones',
            children: {
              create: [
                { name: 'Smartphones' },
                { name: 'Feature Phones' },
              ],
            },
          },
        ],
      },
    },
    include: {
      children: {
        include: { children: true },
      },
    },
  });
  console.log('Category tree:', JSON.stringify(electronics, null, 2));

  // ============================================
  // 7. QUERY WITH MULTIPLE RELATIONS
  // ============================================
  console.log('\n7️⃣ Complex query with multiple relations...');
  const fullPost = await prisma.post.findFirst({
    where: { published: true },
    include: {
      author: {
        select: { name: true, email: true },
      },
      comments: {
        include: {
          author: { select: { name: true } },
          replies: true,
        },
      },
      tags: {
        include: { tag: true },
      },
      likes: {
        include: { user: { select: { name: true } } },
      },
    },
  });
  console.log('Full post data:', JSON.stringify(fullPost, null, 2));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
