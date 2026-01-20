# 🚫 Common Mistakes in TypeORM

> Avoid these pitfalls to build better applications

---

## 1. Using `synchronize: true` in Production

### ❌ Wrong

```typescript
export const AppDataSource = new DataSource({
  synchronize: true, // DANGEROUS!
});
```

### ✅ Correct

```typescript
export const AppDataSource = new DataSource({
  synchronize: false,
  migrations: ["src/migrations/**/*.ts"],
});

// Use migrations instead
npm run migration:generate
npm run migration:run
```

**Why?** `synchronize: true` can drop columns/tables and cause data loss.

---

## 2. Forgetting `reflect-metadata`

### ❌ Wrong

```typescript
// index.ts
import { AppDataSource } from './data-source';
// Missing reflect-metadata!
```

### ✅ Correct

```typescript
// index.ts
import 'reflect-metadata'; // Must be first!
import { AppDataSource } from './data-source';
```

**Why?** TypeORM decorators require reflect-metadata to work.

---

## 3. N+1 Query Problem

### ❌ Wrong

```typescript
const users = await userRepository.find();
for (const user of users) {
  const posts = await postRepository.find({ where: { authorId: user.id } });
  // N additional queries!
}
```

### ✅ Correct

```typescript
const users = await userRepository.find({
  relations: ['posts'],
});
// Single query with JOIN
```

---

## 4. Not Handling Connection Errors

### ❌ Wrong

```typescript
await AppDataSource.initialize();
// No error handling!
```

### ✅ Correct

```typescript
try {
  await AppDataSource.initialize();
  console.log('Database connected');
} catch (error) {
  console.error('Database connection failed:', error);
  process.exit(1);
}
```

---

## 5. Not Closing Connections

### ❌ Wrong

```typescript
// Script ends without closing connection
async function main() {
  await AppDataSource.initialize();
  await doSomething();
  // Connection left open!
}
```

### ✅ Correct

```typescript
async function main() {
  try {
    await AppDataSource.initialize();
    await doSomething();
  } finally {
    await AppDataSource.destroy();
  }
}

// For servers, use graceful shutdown
process.on('SIGTERM', async () => {
  await AppDataSource.destroy();
  process.exit(0);
});
```

---

## 6. Using `save()` for Updates Without Loading

### ❌ Wrong

```typescript
// This creates a new record instead of updating!
await userRepository.save({ id: 1, name: 'New Name' });
```

### ✅ Correct

```typescript
// Option 1: Load then save
const user = await userRepository.findOneBy({ id: 1 });
user.name = 'New Name';
await userRepository.save(user);

// Option 2: Use update
await userRepository.update({ id: 1 }, { name: 'New Name' });
```

---

## 7. Hardcoding Database Credentials

### ❌ Wrong

```typescript
export const AppDataSource = new DataSource({
  host: 'localhost',
  password: 'mypassword123', // Exposed in code!
});
```

### ✅ Correct

```typescript
export const AppDataSource = new DataSource({
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
});
```

---

## 8. Not Using Transactions for Related Operations

### ❌ Wrong

```typescript
await userRepository.save(user);
await profileRepository.save(profile);
// If second fails, first is still saved!
```

### ✅ Correct

```typescript
await AppDataSource.transaction(async (manager) => {
  await manager.save(user);
  await manager.save(profile);
  // Both succeed or both fail
});
```

---

## 9. Selecting All Columns When Not Needed

### ❌ Wrong

```typescript
const users = await userRepository.find();
// Fetches all columns including large text fields
```

### ✅ Correct

```typescript
const users = await userRepository.find({
  select: ['id', 'firstName', 'email'],
});
```

---

## 10. Not Indexing Frequently Queried Columns

### ❌ Wrong

```typescript
@Entity()
export class User {
  @Column()
  email: string; // No index, slow lookups!
}
```

### ✅ Correct

```typescript
@Entity()
@Index(['email'])
export class User {
  @Column({ unique: true })
  email: string;
}
```

---

## 11. Circular Dependency in Entities

### ❌ Wrong

```typescript
// User.ts
import { Post } from './Post'; // Circular!

// Post.ts
import { User } from './User'; // Circular!
```

### ✅ Correct

```typescript
// Use function syntax for relations
@ManyToOne(() => User, (user) => user.posts)
author: User;
```

---

## 12. Not Validating Input Before Saving

### ❌ Wrong

```typescript
const user = userRepository.create(req.body);
await userRepository.save(user); // No validation!
```

### ✅ Correct

```typescript
import { validate } from 'class-validator';

const user = plainToInstance(CreateUserDto, req.body);
const errors = await validate(user);
if (errors.length > 0) {
  throw new BadRequestError('Validation failed');
}
await userRepository.save(user);
```

---

## 13. Using `findOne()` Without `where`

### ❌ Wrong (v0.3+)

```typescript
// This doesn't work in v0.3+
const user = await userRepository.findOne(1);
```

### ✅ Correct

```typescript
const user = await userRepository.findOneBy({ id: 1 });
// or
const user = await userRepository.findOne({ where: { id: 1 } });
```

---

## 14. Not Handling Soft Delete in Queries

### ❌ Wrong

```typescript
// Soft-deleted records are excluded by default
const user = await userRepository.findOneBy({ id: 1 });
// Returns null if soft-deleted
```

### ✅ Correct

```typescript
// Include soft-deleted
const user = await userRepository.findOne({
  where: { id: 1 },
  withDeleted: true,
});
```

---

## 15. Exposing Entities Directly in API

### ❌ Wrong

```typescript
app.get('/users/:id', async (req, res) => {
  const user = await userRepository.findOneBy({ id: req.params.id });
  res.json(user); // Exposes password, internal fields!
});
```

### ✅ Correct

```typescript
app.get('/users/:id', async (req, res) => {
  const user = await userRepository.findOneBy({ id: req.params.id });
  res.json({
    id: user.id,
    firstName: user.firstName,
    email: user.email,
    // Only expose what's needed
  });
});
```

---

## 16. Not Using Parameterized Queries

### ❌ Wrong

```typescript
// SQL Injection vulnerability!
const users = await AppDataSource.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### ✅ Correct

```typescript
const users = await AppDataSource.query(`SELECT * FROM users WHERE email = $1`, [email]);

// Or use QueryBuilder (always parameterized)
const users = await userRepository.createQueryBuilder('user').where('user.email = :email', { email }).getMany();
```

---

## 17. Forgetting TypeScript Decorators Config

### ❌ Wrong

```json
// tsconfig.json missing required options
{
  "compilerOptions": {
    // Missing decorator support!
  }
}
```

### ✅ Correct

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## 18. Using Eager Loading Everywhere

### ❌ Wrong

```typescript
@Entity()
export class User {
  @OneToMany(() => Post, (post) => post.author, { eager: true })
  posts: Post[]; // Always loaded, even when not needed
}
```

### ✅ Correct

```typescript
@Entity()
export class User {
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}

// Load when needed
const user = await userRepository.findOne({
  where: { id: 1 },
  relations: ['posts'],
});
```

---

## 19. Not Handling Unique Constraint Errors

### ❌ Wrong

```typescript
try {
  await userRepository.save(user);
} catch (error) {
  throw error; // Generic error
}
```

### ✅ Correct

```typescript
try {
  await userRepository.save(user);
} catch (error: any) {
  if (error.code === '23505') {
    // PostgreSQL unique violation
    throw new ConflictError('Email already exists');
  }
  throw error;
}
```

---

## 20. Editing Migrations After Running Them

### ❌ Wrong

```typescript
// Migration already run in production
// Developer edits it to add more changes
```

### ✅ Correct

```bash
# Create a new migration for additional changes
npm run migration:generate src/migrations/AddNewColumn
```

---

## Quick Reference: Error Codes

| PostgreSQL Code | Meaning               |
| --------------- | --------------------- |
| 23505           | Unique violation      |
| 23503           | Foreign key violation |
| 23502           | Not null violation    |
| 42P01           | Table doesn't exist   |
| 40P01           | Deadlock detected     |

---

## Checklist Before Production

- [ ] `synchronize: false`
- [ ] All migrations tested
- [ ] Environment variables for credentials
- [ ] Connection pooling configured
- [ ] Indexes on queried columns
- [ ] Error handling in place
- [ ] Graceful shutdown implemented
- [ ] Input validation on all endpoints
- [ ] No sensitive data exposed in responses

---

**Remember: When in doubt, check the [TypeORM documentation](https://typeorm.io/)!**
