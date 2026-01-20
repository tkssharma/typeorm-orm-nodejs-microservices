# Section 10: Node.js + TypeScript + TypeORM

A basic Node.js application with TypeScript and TypeORM demonstrating CRUD operations.

## Project Structure

```
src/
├── data-source.ts    # TypeORM DataSource configuration
├── entities/
│   └── User.ts       # User entity with enum role
└── index.ts          # Main app with CRUD examples
```

## Features

- TypeORM DataSource setup
- User entity with enum, timestamps
- CRUD operations (Create, Read, Update, Delete)
- QueryBuilder examples

## Setup

```bash
# From monorepo root
pnpm install

# Copy environment file
cp .env.example .env

# Run the demo
pnpm dev:10-nodejs
# Or from this folder
pnpm dev
```

## What This Demo Shows

### 1. DataSource Configuration

```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  // ...
  entities: [User],
  synchronize: true,
});
```

### 2. Entity Definition

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;
}
```

### 3. Repository CRUD

```typescript
// Create
const user = userRepository.create({ firstName: 'John' });
await userRepository.save(user);

// Read
const users = await userRepository.find();
const user = await userRepository.findOneBy({ id: 1 });

// Update
user.firstName = 'Jane';
await userRepository.save(user);

// Delete
await userRepository.delete({ id: 1 });
```

### 4. QueryBuilder

```typescript
const admins = await userRepository.createQueryBuilder('user').where('user.role = :role', { role: 'admin' }).getMany();
```

## Output

When you run the demo, you'll see:

- Database connection
- User creation
- User queries
- User updates
- User deletion
- QueryBuilder examples
