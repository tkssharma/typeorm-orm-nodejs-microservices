# Section 10: Database Seeding

## 📚 Learning Objectives

By the end of this section, you will:

- Understand why seeding is important
- Create seed scripts for development
- Use factories for generating test data
- Seed data in different environments
- Implement idempotent seeding

---

## 📖 Lessons

### Lesson 10.1: Why Seed Data?

**Seeding** populates your database with initial or test data.

#### Use Cases

| Environment | Purpose                                   |
| ----------- | ----------------------------------------- |
| Development | Sample data for testing features          |
| Testing     | Consistent test fixtures                  |
| Staging     | Realistic data for QA                     |
| Production  | Initial required data (roles, categories) |

---

### Lesson 10.2: Basic Seed Script

#### Project Structure

```
src/
├── seeds/
│   ├── index.ts           # Main seeder runner
│   ├── userSeeder.ts      # User seed data
│   ├── productSeeder.ts   # Product seed data
│   └── factories/
│       ├── userFactory.ts
│       └── productFactory.ts
```

#### Simple Seed Script

```typescript
// src/seeds/userSeeder.ts
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

export async function seedUsers() {
  const userRepository = AppDataSource.getRepository(User);

  const users = [
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: 'admin',
    },
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'user',
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      role: 'user',
    },
  ];

  for (const userData of users) {
    const existingUser = await userRepository.findOneBy({
      email: userData.email,
    });

    if (!existingUser) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(`✅ Created user: ${userData.email}`);
    } else {
      console.log(`⏭️ User already exists: ${userData.email}`);
    }
  }
}
```

#### Main Seeder Runner

```typescript
// src/seeds/index.ts
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedUsers } from './userSeeder';
import { seedProducts } from './productSeeder';

async function runSeeders() {
  try {
    await AppDataSource.initialize();
    console.log('🌱 Starting database seeding...\n');

    await seedUsers();
    await seedProducts();

    console.log('\n✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeeders();
```

#### Package.json Script

```json
{
  "scripts": {
    "seed": "ts-node src/seeds/index.ts",
    "seed:fresh": "npm run schema:drop && npm run migration:run && npm run seed"
  }
}
```

---

### Lesson 10.3: Using Factories

Factories generate random but realistic data.

#### Install Faker

```bash
npm install @faker-js/faker
```

#### User Factory

```typescript
// src/seeds/factories/userFactory.ts
import { faker } from '@faker-js/faker';
import { User, UserRole, UserStatus } from '../../entities/User';

export function createUserData(overrides: Partial<User> = {}): Partial<User> {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    role: faker.helpers.arrayElement(Object.values(UserRole)),
    status: UserStatus.ACTIVE,
    isEmailVerified: faker.datatype.boolean(),
    age: faker.number.int({ min: 18, max: 80 }),
    ...overrides,
  };
}

export function createManyUsers(count: number, overrides: Partial<User> = {}): Partial<User>[] {
  return Array.from({ length: count }, () => createUserData(overrides));
}
```

#### Product Factory

```typescript
// src/seeds/factories/productFactory.ts
import { faker } from '@faker-js/faker';
import { Product, ProductCategory } from '../../entities/Product';

export function createProductData(overrides: Partial<Product> = {}): Partial<Product> {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.commerce.price({ min: 10, max: 1000 }),
    quantity: faker.number.int({ min: 0, max: 500 }),
    category: faker.helpers.arrayElement(Object.values(ProductCategory)),
    isAvailable: faker.datatype.boolean({ probability: 0.8 }),
    tags: faker.helpers.arrayElements(['sale', 'new', 'featured', 'bestseller', 'limited'], { min: 0, max: 3 }),
    ...overrides,
  };
}

export function createManyProducts(count: number, overrides: Partial<Product> = []): Partial<Product>[] {
  return Array.from({ length: count }, () => createProductData(overrides));
}
```

#### Using Factories in Seeders

```typescript
// src/seeds/userSeeder.ts
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { createUserData, createManyUsers } from './factories/userFactory';

export async function seedUsers() {
  const userRepository = AppDataSource.getRepository(User);

  // Create admin user
  const adminExists = await userRepository.findOneBy({ email: 'admin@example.com' });
  if (!adminExists) {
    const admin = userRepository.create(
      createUserData({
        email: 'admin@example.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
      }),
    );
    await userRepository.save(admin);
    console.log('✅ Created admin user');
  }

  // Create random users
  const existingCount = await userRepository.count();
  const targetCount = 50;

  if (existingCount < targetCount) {
    const usersToCreate = targetCount - existingCount;
    const users = createManyUsers(usersToCreate);

    for (const userData of users) {
      try {
        const user = userRepository.create(userData);
        await userRepository.save(user);
      } catch (error) {
        // Skip duplicates
      }
    }
    console.log(`✅ Created ${usersToCreate} random users`);
  }
}
```

---

### Lesson 10.4: Seeding with Relationships

```typescript
// src/seeds/postSeeder.ts
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Post } from '../entities/Post';
import { Tag } from '../entities/Tag';
import { faker } from '@faker-js/faker';

export async function seedPosts() {
  const userRepository = AppDataSource.getRepository(User);
  const postRepository = AppDataSource.getRepository(Post);
  const tagRepository = AppDataSource.getRepository(Tag);

  // Get existing users
  const users = await userRepository.find({ take: 10 });
  if (users.length === 0) {
    console.log('⚠️ No users found. Run user seeder first.');
    return;
  }

  // Create tags if they don't exist
  const tagNames = ['javascript', 'typescript', 'nodejs', 'react', 'database'];
  const tags: Tag[] = [];

  for (const name of tagNames) {
    let tag = await tagRepository.findOneBy({ name });
    if (!tag) {
      tag = tagRepository.create({ name });
      await tagRepository.save(tag);
    }
    tags.push(tag);
  }
  console.log(`✅ Ensured ${tags.length} tags exist`);

  // Create posts for each user
  const existingPosts = await postRepository.count();
  if (existingPosts > 0) {
    console.log('⏭️ Posts already exist, skipping...');
    return;
  }

  for (const user of users) {
    const postCount = faker.number.int({ min: 1, max: 5 });

    for (let i = 0; i < postCount; i++) {
      const post = postRepository.create({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(3),
        isPublished: faker.datatype.boolean({ probability: 0.7 }),
        author: user,
        tags: faker.helpers.arrayElements(tags, { min: 1, max: 3 }),
      });
      await postRepository.save(post);
    }
  }

  const totalPosts = await postRepository.count();
  console.log(`✅ Created ${totalPosts} posts`);
}
```

---

### Lesson 10.5: Environment-Specific Seeding

```typescript
// src/seeds/index.ts
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedRequiredData } from './requiredSeeder';
import { seedDevelopmentData } from './developmentSeeder';

async function runSeeders() {
  const env = process.env.NODE_ENV || 'development';

  try {
    await AppDataSource.initialize();
    console.log(`🌱 Running seeders for ${env} environment...\n`);

    // Always run required data (roles, permissions, etc.)
    await seedRequiredData();

    // Only seed test data in development/test
    if (env === 'development' || env === 'test') {
      await seedDevelopmentData();
    }

    console.log('\n✅ Seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeeders();
```

```typescript
// src/seeds/requiredSeeder.ts
export async function seedRequiredData() {
  console.log('📦 Seeding required data...');

  // Seed roles
  await seedRoles();

  // Seed permissions
  await seedPermissions();

  // Seed default categories
  await seedCategories();
}

async function seedRoles() {
  const roleRepository = AppDataSource.getRepository(Role);

  const roles = [
    { name: 'admin', description: 'Administrator' },
    { name: 'user', description: 'Regular user' },
    { name: 'moderator', description: 'Content moderator' },
  ];

  for (const roleData of roles) {
    const exists = await roleRepository.findOneBy({ name: roleData.name });
    if (!exists) {
      await roleRepository.save(roleRepository.create(roleData));
      console.log(`  ✅ Created role: ${roleData.name}`);
    }
  }
}
```

---

### Lesson 10.6: Idempotent Seeding

Seeders should be safe to run multiple times.

```typescript
// src/seeds/utils/seedUtils.ts
import { Repository, ObjectLiteral } from 'typeorm';

export async function upsertSeed<T extends ObjectLiteral>(
  repository: Repository<T>,
  data: Partial<T>,
  uniqueKey: keyof T,
): Promise<T> {
  const existing = await repository.findOneBy({
    [uniqueKey]: data[uniqueKey],
  } as any);

  if (existing) {
    // Update existing record
    Object.assign(existing, data);
    return repository.save(existing);
  } else {
    // Create new record
    const entity = repository.create(data as T);
    return repository.save(entity);
  }
}

export async function seedIfEmpty<T extends ObjectLiteral>(
  repository: Repository<T>,
  data: Partial<T>[],
  label: string,
): Promise<void> {
  const count = await repository.count();

  if (count === 0) {
    const entities = data.map((d) => repository.create(d as T));
    await repository.save(entities);
    console.log(`✅ Seeded ${entities.length} ${label}`);
  } else {
    console.log(`⏭️ ${label} already seeded (${count} records)`);
  }
}
```

```typescript
// Usage
import { upsertSeed, seedIfEmpty } from './utils/seedUtils';

// Upsert - update if exists, create if not
await upsertSeed(
  userRepository,
  {
    email: 'admin@example.com',
    firstName: 'Admin',
    role: 'admin',
  },
  'email',
);

// Seed only if table is empty
await seedIfEmpty(categoryRepository, [{ name: 'Electronics' }, { name: 'Clothing' }, { name: 'Books' }], 'categories');
```

---

### Lesson 10.7: Seed with Transactions

```typescript
// src/seeds/transactionalSeeder.ts
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Profile } from '../entities/Profile';

export async function seedUsersWithProfiles() {
  await AppDataSource.transaction(async (manager) => {
    const userRepository = manager.getRepository(User);
    const profileRepository = manager.getRepository(Profile);

    // Create user
    const user = userRepository.create({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
    await userRepository.save(user);

    // Create profile
    const profile = profileRepository.create({
      bio: 'Test user bio',
      user: user,
    });
    await profileRepository.save(profile);

    console.log('✅ Created user with profile in transaction');
  });
}
```

---

### Lesson 10.8: CLI Seeder with Options

```typescript
// src/seeds/cli.ts
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedUsers } from './userSeeder';
import { seedProducts } from './productSeeder';
import { seedPosts } from './postSeeder';

const seeders: Record<string, () => Promise<void>> = {
  users: seedUsers,
  products: seedProducts,
  posts: seedPosts,
};

async function main() {
  const args = process.argv.slice(2);
  const seederName = args[0];
  const fresh = args.includes('--fresh');

  try {
    await AppDataSource.initialize();

    if (fresh) {
      console.log('🗑️ Dropping all tables...');
      await AppDataSource.dropDatabase();
      await AppDataSource.synchronize();
      console.log('✅ Database reset\n');
    }

    if (seederName && seeders[seederName]) {
      console.log(`🌱 Running ${seederName} seeder...`);
      await seeders[seederName]();
    } else if (!seederName) {
      console.log('🌱 Running all seeders...\n');
      for (const [name, seeder] of Object.entries(seeders)) {
        console.log(`\n📦 ${name}:`);
        await seeder();
      }
    } else {
      console.log(`❌ Unknown seeder: ${seederName}`);
      console.log(`Available: ${Object.keys(seeders).join(', ')}`);
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

main();
```

```json
{
  "scripts": {
    "seed": "ts-node src/seeds/cli.ts",
    "seed:users": "ts-node src/seeds/cli.ts users",
    "seed:products": "ts-node src/seeds/cli.ts products",
    "seed:fresh": "ts-node src/seeds/cli.ts --fresh"
  }
}
```

---

## 🎯 Key Takeaways

1. **Seeders** populate databases with initial/test data
2. Use **factories** with Faker for realistic random data
3. Make seeders **idempotent** (safe to run multiple times)
4. Use **environment checks** for dev-only data
5. Seed **relationships** in correct order
6. Use **transactions** for related data

---

## ✅ Quiz

1. What is the purpose of database seeding?
2. Why should seeders be idempotent?
3. What library is commonly used for generating fake data?
4. How do you ensure required data exists without duplicating?
5. When should you NOT seed test data?

<details>
<summary>View Answers</summary>

1. To populate the database with initial or test data
2. So they can be run multiple times without errors or duplicates
3. @faker-js/faker
4. Check if record exists before creating, or use upsert
5. In production environment

</details>

---

## 📝 Homework

1. Create factories for User, Product, and Post entities
2. Implement seeders that create 50 users, 100 products, and posts with relationships
3. Add a CLI that allows running specific seeders
4. Make all seeders idempotent

---

## ➡️ Next Section

[Section 11: Transactions](../section-11-transactions/README.md)
