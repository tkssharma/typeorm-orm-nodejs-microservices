import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Author } from '../entities/Author';
import { Post, PostStatus } from '../entities/Post';
import { Comment } from '../entities/Comment';

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected');

  const authorRepo = AppDataSource.getRepository(Author);
  const postRepo = AppDataSource.getRepository(Post);
  const commentRepo = AppDataSource.getRepository(Comment);

  // Clear existing data
  await commentRepo.delete({});
  await postRepo.delete({});
  await authorRepo.delete({});
  console.log('Cleared existing data');

  // Create authors
  const authors = await authorRepo.save([
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      bio: 'Senior software developer with 10+ years of experience in TypeScript and Node.js',
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      bio: 'Full-stack developer passionate about clean code and best practices',
    },
    {
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@example.com',
      bio: 'Database architect and ORM enthusiast',
    },
  ]);
  console.log(`Created ${authors.length} authors`);

  // Create posts
  const posts = await postRepo.save([
    {
      title: 'Getting Started with TypeORM',
      slug: 'getting-started-with-typeorm',
      excerpt: 'Learn the basics of TypeORM and how to set it up in your Node.js project',
      content: `TypeORM is a powerful ORM that can run in Node.js and can be used with TypeScript and JavaScript.
      
In this tutorial, we'll cover:
1. Installing TypeORM
2. Configuring the DataSource
3. Creating your first entity
4. Running migrations

TypeORM makes database operations intuitive and type-safe when used with TypeScript.`,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: authors[0].id,
    },
    {
      title: 'Understanding TypeORM Relationships',
      slug: 'understanding-typeorm-relationships',
      excerpt: 'Deep dive into One-to-One, One-to-Many, and Many-to-Many relationships',
      content: `Relationships are a core concept in relational databases. TypeORM provides decorators to define these relationships easily.

## One-to-One
Use @OneToOne decorator when one entity is associated with exactly one other entity.

## One-to-Many / Many-to-One
Use @OneToMany and @ManyToOne when one entity can have multiple related entities.

## Many-to-Many
Use @ManyToMany when entities can have multiple relationships in both directions.`,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 86400000), // 1 day ago
      authorId: authors[0].id,
    },
    {
      title: 'TypeORM Migrations Best Practices',
      slug: 'typeorm-migrations-best-practices',
      excerpt: 'Learn how to manage database schema changes safely with migrations',
      content: `Migrations are essential for production applications. Never use synchronize: true in production!

## Key Practices:
1. Always generate migrations from entity changes
2. Test migrations by running and reverting
3. Never edit executed migrations
4. Keep migrations small and focused
5. Use transactions for data migrations`,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 172800000), // 2 days ago
      authorId: authors[1].id,
    },
    {
      title: 'Working with Transactions in TypeORM',
      slug: 'working-with-transactions-typeorm',
      excerpt: 'Ensure data integrity with proper transaction handling',
      content: `Transactions ensure that a series of database operations either all succeed or all fail together.

## Using Transactions:
\`\`\`typescript
await dataSource.transaction(async (manager) => {
  await manager.save(entity1);
  await manager.save(entity2);
  // If any operation fails, all are rolled back
});
\`\`\``,
      status: PostStatus.DRAFT,
      authorId: authors[1].id,
    },
    {
      title: 'Soft Deletes in TypeORM',
      slug: 'soft-deletes-typeorm',
      excerpt: 'Implement soft delete pattern for data recovery',
      content: `Soft deletes allow you to mark records as deleted without actually removing them from the database.

Add @DeleteDateColumn() to your entity and use softDelete() instead of delete().`,
      status: PostStatus.ARCHIVED,
      authorId: authors[2].id,
    },
  ]);
  console.log(`Created ${posts.length} posts`);

  // Create comments
  const comments = await commentRepo.save([
    {
      authorName: 'Alice Reader',
      authorEmail: 'alice@reader.com',
      content: 'Great introduction! This helped me get started quickly.',
      postId: posts[0].id,
      isApproved: true,
    },
    {
      authorName: 'Charlie Developer',
      authorEmail: 'charlie@dev.com',
      content: 'Very comprehensive guide. Would love to see more examples.',
      postId: posts[0].id,
      isApproved: true,
    },
    {
      authorName: 'Diana Coder',
      authorEmail: 'diana@code.com',
      content: 'The relationship examples are exactly what I needed!',
      postId: posts[1].id,
      isApproved: true,
    },
    {
      authorName: 'Eve Learner',
      authorEmail: 'eve@learn.com',
      content: 'Could you explain cascade options in more detail?',
      postId: posts[1].id,
      isApproved: false, // Pending approval
    },
  ]);
  console.log(`Created ${comments.length} comments`);

  // Create a reply to a comment
  const reply = await commentRepo.save({
    authorName: 'John Doe',
    authorEmail: 'john@example.com',
    content: 'Thanks for the feedback! I\'ll add more examples in a follow-up post.',
    postId: posts[0].id,
    parentId: comments[1].id,
    isApproved: true,
  });
  console.log('Created 1 reply');

  console.log('\nSeed completed successfully!');
  console.log('Summary:');
  console.log(`  - Authors: ${authors.length}`);
  console.log(`  - Posts: ${posts.length}`);
  console.log(`  - Comments: ${comments.length + 1}`);

  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
