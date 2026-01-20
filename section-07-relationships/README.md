# Section 07: Relationships

## 📚 Learning Objectives

By the end of this section, you will:

- Implement all relationship types in TypeORM
- Understand One-to-One, One-to-Many, Many-to-Many
- Configure cascade operations
- Choose between eager and lazy loading
- Handle self-referencing relationships

---

## 📖 Lessons

### Lesson 7.1: Relationship Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Relationship Types                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  One-to-One (1:1)      User ←────→ Profile                  │
│  One user has one profile                                    │
│                                                              │
│  One-to-Many (1:N)     User ←────→ Posts[]                  │
│  One user has many posts                                     │
│                                                              │
│  Many-to-Many (M:N)    Post ←────→ Tags[]                   │
│  Many posts have many tags                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Lesson 7.2: One-to-One Relationship

A user has exactly one profile, and a profile belongs to exactly one user.

#### Entities

```typescript
// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Profile } from './Profile';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;
}
```

```typescript
// src/entities/Profile.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column()
  userId: number;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'userId' }) // This side owns the relationship
  user: User;
}
```

#### Key Points

- **@JoinColumn()** goes on the owning side (the table with the foreign key)
- Only one side needs `@JoinColumn()`
- The side with `@JoinColumn()` will have the foreign key column

#### Usage

```typescript
// Create user with profile
const user = new User();
user.email = 'john@example.com';
await userRepository.save(user);

const profile = new Profile();
profile.bio = 'Software Developer';
profile.user = user;
await profileRepository.save(profile);

// Query with relation
const userWithProfile = await userRepository.findOne({
  where: { id: 1 },
  relations: ['profile'],
});
```

---

### Lesson 7.3: One-to-Many / Many-to-One

A user can have many posts, but each post belongs to one user.

#### Entities

```typescript
// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Post } from './Post';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
```

```typescript
// src/entities/Post.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isPublished: boolean;

  @Column()
  authorId: number;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### Key Points

- **@ManyToOne** always has the foreign key (no `@JoinColumn` required, but recommended)
- **@OneToMany** cannot exist without **@ManyToOne**
- The "many" side owns the relationship

#### Usage

```typescript
// Create post for user
const user = await userRepository.findOneBy({ id: 1 });

const post = new Post();
post.title = 'My First Post';
post.content = 'Hello World!';
post.author = user;
await postRepository.save(post);

// Query user with posts
const userWithPosts = await userRepository.findOne({
  where: { id: 1 },
  relations: ['posts'],
});

// Query posts with author
const posts = await postRepository.find({
  relations: ['author'],
  where: { isPublished: true },
});
```

---

### Lesson 7.4: Many-to-Many Relationship

Posts can have multiple tags, and tags can belong to multiple posts.

#### Basic Many-to-Many

```typescript
// src/entities/Post.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Tag } from './Tag';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable({
    name: 'post_tags', // Junction table name
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
```

```typescript
// src/entities/Tag.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Post } from './Post';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}
```

#### Key Points

- **@JoinTable()** goes on one side only (the owning side)
- Creates a junction table automatically
- Both sides can query the relationship

#### Usage

```typescript
// Create tags
const tag1 = tagRepository.create({ name: 'typescript' });
const tag2 = tagRepository.create({ name: 'nodejs' });
await tagRepository.save([tag1, tag2]);

// Create post with tags
const post = postRepository.create({
  title: 'TypeORM Guide',
  tags: [tag1, tag2],
});
await postRepository.save(post);

// Query posts with tags
const postsWithTags = await postRepository.find({
  relations: ['tags'],
});

// Add tag to existing post
const existingPost = await postRepository.findOne({
  where: { id: 1 },
  relations: ['tags'],
});
existingPost.tags.push(newTag);
await postRepository.save(existingPost);
```

#### Many-to-Many with Custom Junction Table

When you need extra columns on the junction table:

```typescript
// src/entities/PostTag.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Post } from './Post';
import { Tag } from './Tag';

@Entity('post_tags')
export class PostTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @Column()
  tagId: number;

  @ManyToOne(() => Post, (post) => post.postTags)
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ManyToOne(() => Tag, (tag) => tag.postTags)
  @JoinColumn({ name: 'tagId' })
  tag: Tag;

  // Extra columns
  @Column({ default: 0 })
  order: number;

  @CreateDateColumn()
  addedAt: Date;
}
```

```typescript
// Updated Post entity
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @OneToMany(() => PostTag, (postTag) => postTag.post)
  postTags: PostTag[];
}

// Updated Tag entity
@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => PostTag, (postTag) => postTag.tag)
  postTags: PostTag[];
}
```

---

### Lesson 7.5: Self-Referencing Relationships

Entities that reference themselves.

#### Tree Structure (Category with Subcategories)

```typescript
// src/entities/Category.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  parentId: number | null;

  @ManyToOne(() => Category, (category) => category.children)
  @JoinColumn({ name: 'parentId' })
  parent: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];
}
```

#### Usage

```typescript
// Create parent category
const electronics = categoryRepository.create({ name: 'Electronics' });
await categoryRepository.save(electronics);

// Create child categories
const phones = categoryRepository.create({
  name: 'Phones',
  parent: electronics,
});
const laptops = categoryRepository.create({
  name: 'Laptops',
  parent: electronics,
});
await categoryRepository.save([phones, laptops]);

// Query with children
const category = await categoryRepository.findOne({
  where: { id: electronics.id },
  relations: ['children'],
});
```

#### User Following (Many-to-Many Self-Reference)

```typescript
// src/entities/User.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @ManyToMany(() => User, (user) => user.following)
  @JoinTable({
    name: 'user_followers',
    joinColumn: { name: 'followerId' },
    inverseJoinColumn: { name: 'followingId' },
  })
  followers: User[];

  @ManyToMany(() => User, (user) => user.followers)
  following: User[];
}
```

---

### Lesson 7.6: Cascade Operations

Cascades automatically propagate operations to related entities.

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Post, (post) => post.author, {
    cascade: true, // Enable all cascades
  })
  posts: Post[];

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: ['insert', 'update'], // Specific cascades
  })
  profile: Profile;
}
```

#### Cascade Options

| Option            | Description          |
| ----------------- | -------------------- |
| `true`            | Enable all cascades  |
| `["insert"]`      | Cascade inserts only |
| `["update"]`      | Cascade updates only |
| `["remove"]`      | Cascade removes only |
| `["soft-remove"]` | Cascade soft removes |
| `["recover"]`     | Cascade recovers     |

#### Example with Cascade

```typescript
// With cascade: true on posts relation
const user = userRepository.create({
  email: 'john@example.com',
  posts: [
    { title: 'Post 1', content: 'Content 1' },
    { title: 'Post 2', content: 'Content 2' },
  ],
});

// This saves user AND all posts automatically
await userRepository.save(user);
```

#### ⚠️ Cascade Warnings

```typescript
// Be careful with cascade: ["remove"]
// Deleting user will delete all their posts!

// Consider using onDelete instead
@ManyToOne(() => User, (user) => user.posts, {
  onDelete: "CASCADE", // Database-level cascade
})
author: User;
```

---

### Lesson 7.7: Eager vs Lazy Loading

#### Eager Loading

Relations are automatically loaded with every query.

```typescript
@Entity('users')
export class User {
  @OneToOne(() => Profile, { eager: true })
  @JoinColumn()
  profile: Profile; // Always loaded
}

// Profile is automatically included
const user = await userRepository.findOneBy({ id: 1 });
console.log(user.profile); // Already loaded
```

#### Lazy Loading

Relations are loaded on demand.

```typescript
@Entity('users')
export class User {
  @OneToMany(() => Post, (post) => post.author, { lazy: true })
  posts: Promise<Post[]>; // Note: Promise type
}

// Posts are loaded when accessed
const user = await userRepository.findOneBy({ id: 1 });
const posts = await user.posts; // Query executed here
```

#### Explicit Loading (Recommended)

```typescript
// Load relations explicitly when needed
const user = await userRepository.findOne({
  where: { id: 1 },
  relations: ['posts', 'profile'],
});

// Or with QueryBuilder
const user = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post')
  .leftJoinAndSelect('user.profile', 'profile')
  .where('user.id = :id', { id: 1 })
  .getOne();
```

#### Best Practice

| Loading Type | Use When                  |
| ------------ | ------------------------- |
| Eager        | Relation is always needed |
| Lazy         | Relation is rarely needed |
| Explicit     | Most cases (recommended)  |

---

### Lesson 7.8: Relation Options

```typescript
@ManyToOne(() => User, (user) => user.posts, {
  // Eager loading
  eager: false,

  // Lazy loading
  lazy: false,

  // Cascade operations
  cascade: false,

  // Database-level actions
  onDelete: "CASCADE", // CASCADE, SET NULL, RESTRICT, NO ACTION
  onUpdate: "CASCADE",

  // Nullable
  nullable: true,

  // Orphan removal (remove child when removed from parent)
  orphanedRowAction: "delete", // delete, soft-delete, nullify, disable
})
author: User;
```

---

### Lesson 7.9: Querying Relations

#### Using Find Options

```typescript
// Load specific relations
const users = await userRepository.find({
  relations: ['posts', 'profile'],
});

// Nested relations
const users = await userRepository.find({
  relations: ['posts', 'posts.comments', 'posts.tags'],
});

// Filter by relation
const users = await userRepository.find({
  relations: ['posts'],
  where: {
    posts: {
      isPublished: true,
    },
  },
});
```

#### Using QueryBuilder

```typescript
// Join and select
const users = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post')
  .leftJoinAndSelect('post.tags', 'tag')
  .where('user.isActive = :active', { active: true })
  .getMany();

// Join with condition
const users = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post', 'post.isPublished = :published', {
    published: true,
  })
  .getMany();

// Count relations
const users = await userRepository
  .createQueryBuilder('user')
  .loadRelationCountAndMap('user.postCount', 'user.posts')
  .getMany();
```

---

## 🎯 Key Takeaways

1. **@JoinColumn()** marks the owning side (has foreign key)
2. **@JoinTable()** is for Many-to-Many (one side only)
3. Use **cascade** carefully - can cause unintended deletes
4. Prefer **explicit loading** over eager/lazy
5. Use **custom junction tables** when you need extra columns
6. **onDelete: "CASCADE"** is database-level, more reliable

---

## ✅ Quiz

1. Which decorator marks the owning side of a One-to-One relationship?
2. In One-to-Many, which side has the foreign key?
3. What does `@JoinTable()` create?
4. What's the difference between cascade and onDelete?
5. When would you use a custom junction table?

<details>
<summary>View Answers</summary>

1. `@JoinColumn()`
2. The Many side (the entity with `@ManyToOne`)
3. A junction/pivot table for Many-to-Many relationships
4. Cascade is TypeORM-level (in application); onDelete is database-level
5. When you need extra columns on the relationship (e.g., order, createdAt)

</details>

---

## 📝 Homework

1. Create a blog system with: User, Post, Comment, Tag entities
2. Implement: User has many Posts, Post has many Comments, Post has many Tags
3. Add a self-referencing Comment (replies)
4. Query posts with all relations loaded

---

## ➡️ Next Section

[Section 08: QueryBuilder](../section-08-querybuilder/README.md)
