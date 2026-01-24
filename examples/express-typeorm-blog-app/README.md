# Express + TypeScript + TypeORM Blog App

A comprehensive example demonstrating TypeORM fundamentals with Express and TypeScript. This blog application covers:

- **Entities & Relationships**: Author, Post, Comment with One-to-Many and self-referencing relationships
- **Migrations**: Complete migration setup with proper up/down methods
- **Transactions**: Service layer demonstrating atomic operations
- **Soft Deletes**: Post entity with soft delete support
- **Query Builder**: Advanced queries in services

## 📁 Project Structure

```
src/
├── data-source.ts          # TypeORM DataSource configuration
├── index.ts                # Express app entry point
├── entities/
│   ├── Author.ts           # Author entity (One-to-Many with Post)
│   ├── Post.ts             # Post entity (Many-to-One, One-to-Many, soft delete)
│   ├── Comment.ts          # Comment entity (self-referencing for replies)
│   └── index.ts
├── services/
│   ├── AuthorService.ts    # Author CRUD operations
│   ├── PostService.ts      # Post CRUD with soft delete
│   ├── CommentService.ts   # Comment operations with replies
│   ├── TransactionService.ts # Transaction examples
│   └── index.ts
├── routes/
│   ├── authorRoutes.ts     # Author API endpoints
│   ├── postRoutes.ts       # Post API endpoints
│   ├── commentRoutes.ts    # Comment API endpoints
│   └── index.ts
├── migrations/
│   └── 1706000000000-CreateBlogSchema.ts
└── seeds/
    └── seed.ts             # Database seeding script
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
```

### Database Setup

```bash
# Create the database
createdb blog_app

# Run migrations
npm run migration:run

# Seed sample data (optional)
npm run seed
```

### Running the App

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 📚 Key Concepts Demonstrated

### 1. Entity Relationships

**Author → Posts (One-to-Many)**

```typescript
@Entity('authors')
export class Author {
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
```

**Post → Author (Many-to-One)**

```typescript
@Entity('posts')
export class Post {
  @ManyToOne(() => Author, (author) => author.posts)
  @JoinColumn({ name: 'authorId' })
  author: Author;
}
```

**Comment → Replies (Self-Referencing)**

```typescript
@Entity('comments')
export class Comment {
  @ManyToOne(() => Comment, (comment) => comment.replies)
  parent: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];
}
```

### 2. Migrations

Generate migrations from entity changes:

```bash
npm run migration:generate src/migrations/AddNewFeature
```

Run migrations:

```bash
npm run migration:run
```

Revert last migration:

```bash
npm run migration:revert
```

### 3. Transactions

```typescript
async createAuthorWithPost(authorData, postData) {
  return AppDataSource.transaction(async (manager) => {
    const author = await manager.save(Author, authorData);
    const post = await manager.save(Post, { ...postData, authorId: author.id });
    return { author, post };
  });
}
```

### 4. Soft Deletes

```typescript
@Entity('posts')
export class Post {
  @DeleteDateColumn()
  deletedAt: Date | null;
}

// Soft delete
await postRepository.softDelete(id);

// Restore
await postRepository.restore(id);

// Query including deleted
await postRepository.find({ withDeleted: true });
```

## 🔌 API Endpoints

### Authors

| Method | Endpoint                    | Description                 |
| ------ | --------------------------- | --------------------------- |
| GET    | /api/authors                | Get all authors             |
| GET    | /api/authors/:id            | Get author by ID            |
| GET    | /api/authors/stats          | Get authors with post count |
| POST   | /api/authors                | Create author               |
| PUT    | /api/authors/:id            | Update author               |
| DELETE | /api/authors/:id            | Delete author               |
| PATCH  | /api/authors/:id/deactivate | Deactivate author           |

### Posts

| Method | Endpoint                    | Description         |
| ------ | --------------------------- | ------------------- |
| GET    | /api/posts                  | Get all posts       |
| GET    | /api/posts/published        | Get published posts |
| GET    | /api/posts/:id              | Get post by ID      |
| GET    | /api/posts/slug/:slug       | Get post by slug    |
| GET    | /api/posts/author/:authorId | Get posts by author |
| GET    | /api/posts/search?q=query   | Search posts        |
| GET    | /api/posts/stats            | Get post statistics |
| POST   | /api/posts                  | Create post         |
| PUT    | /api/posts/:id              | Update post         |
| PATCH  | /api/posts/:id/publish      | Publish post        |
| PATCH  | /api/posts/:id/archive      | Archive post        |
| DELETE | /api/posts/:id              | Soft delete post    |
| PATCH  | /api/posts/:id/restore      | Restore post        |
| DELETE | /api/posts/:id/permanent    | Permanently delete  |

### Comments

| Method | Endpoint                   | Description           |
| ------ | -------------------------- | --------------------- |
| GET    | /api/comments/post/:postId | Get comments for post |
| GET    | /api/comments/pending      | Get pending comments  |
| GET    | /api/comments/:id          | Get comment by ID     |
| POST   | /api/comments              | Create comment        |
| POST   | /api/comments/:id/reply    | Reply to comment      |
| PATCH  | /api/comments/:id/approve  | Approve comment       |
| DELETE | /api/comments/:id          | Delete comment        |

## 🧪 Testing the API

```bash
# Create an author
curl -X POST http://localhost:3000/api/authors \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe", "email": "john@example.com"}'

# Create a post
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Post", "content": "Hello World!", "authorId": 1}'

# Publish the post
curl -X PATCH http://localhost:3000/api/posts/1/publish

# Add a comment
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"postId": 1, "authorName": "Reader", "authorEmail": "reader@example.com", "content": "Great post!"}'
```

## 📝 Migration Commands

```bash
# Generate migration from entity changes
npm run migration:generate src/migrations/MigrationName

# Create empty migration
npm run migration:create src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

## 🎯 Learning Objectives

After studying this example, you should understand:

1. How to structure a TypeORM project with Express
2. Defining entities with various column types and decorators
3. Implementing One-to-Many and self-referencing relationships
4. Creating and running migrations
5. Using transactions for atomic operations
6. Implementing soft delete pattern
7. Building a service layer with repository pattern
8. Query Builder for complex queries
