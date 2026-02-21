# Section 28: Prisma Testing Strategies

## Topics Covered

### 1. Testing Approaches
- Unit testing with mocked Prisma
- Integration testing with test database
- E2E testing strategies
- Test isolation patterns

### 2. Mocking Prisma Client
```typescript
// __mocks__/prisma.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

export default prismaMock;
```

```typescript
// src/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

```typescript
// jest.config.js
module.exports = {
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@/db$': '<rootDir>/__mocks__/prisma.ts'
  }
};
```

### 3. Unit Testing with Mocks
```typescript
// src/services/user.service.ts
import { prisma } from '@/db';

export class UserService {
  async createUser(email: string, name: string) {
    return prisma.user.create({
      data: { email, name }
    });
  }

  async getUserById(id: number) {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  async getUserWithPosts(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: { posts: true }
    });
  }
}
```

```typescript
// tests/user.service.test.ts
import { prismaMock } from '../__mocks__/prisma';
import { UserService } from '../src/services/user.service';

jest.mock('@/db', () => ({
  prisma: prismaMock
}));

describe('UserService', () => {
  const service = new UserService();

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date()
      };

      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await service.createUser('test@example.com', 'Test User');

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: { email: 'test@example.com', name: 'Test User' }
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserById(1);

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserById(999);

      expect(result).toBeNull();
    });
  });
});
```

### 4. Integration Testing with Test Database
```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Push schema to test database
  execSync('npx prisma db push --force-reset', {
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL
    }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
```

```typescript
// test/integration/user.integration.test.ts
import { prisma } from '../setup';

describe('User Integration Tests', () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should create and retrieve a user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'integration@test.com',
        name: 'Integration Test'
      }
    });

    const found = await prisma.user.findUnique({
      where: { id: user.id }
    });

    expect(found).toMatchObject({
      email: 'integration@test.com',
      name: 'Integration Test'
    });
  });

  it('should create user with posts', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'author@test.com',
        name: 'Author',
        posts: {
          create: [
            { title: 'Post 1', published: true },
            { title: 'Post 2', published: false }
          ]
        }
      },
      include: { posts: true }
    });

    expect(user.posts).toHaveLength(2);
    expect(user.posts[0].title).toBe('Post 1');
  });

  it('should handle unique constraint violation', async () => {
    await prisma.user.create({
      data: { email: 'unique@test.com', name: 'First' }
    });

    await expect(
      prisma.user.create({
        data: { email: 'unique@test.com', name: 'Second' }
      })
    ).rejects.toThrow();
  });
});
```

### 5. Test Fixtures & Factories
```typescript
// test/factories/user.factory.ts
import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

export function buildUser(overrides: Partial<Prisma.UserCreateInput> = {}): Prisma.UserCreateInput {
  return {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    ...overrides
  };
}

export function buildPost(overrides: Partial<Prisma.PostCreateWithoutAuthorInput> = {}): Prisma.PostCreateWithoutAuthorInput {
  return {
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    published: faker.datatype.boolean(),
    ...overrides
  };
}
```

```typescript
// test/factories/index.ts
import { prisma } from '../setup';
import { buildUser, buildPost } from './user.factory';

export async function createUser(overrides = {}) {
  return prisma.user.create({
    data: buildUser(overrides)
  });
}

export async function createUserWithPosts(userOverrides = {}, postCount = 3) {
  return prisma.user.create({
    data: {
      ...buildUser(userOverrides),
      posts: {
        create: Array.from({ length: postCount }, () => buildPost())
      }
    },
    include: { posts: true }
  });
}
```

```typescript
// Usage in tests
import { createUser, createUserWithPosts } from '../factories';

it('should list user posts', async () => {
  const user = await createUserWithPosts({}, 5);
  
  const posts = await prisma.post.findMany({
    where: { authorId: user.id }
  });
  
  expect(posts).toHaveLength(5);
});
```

### 6. Testing Transactions
```typescript
// src/services/order.service.ts
export async function createOrder(userId: number, items: OrderItem[]) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: { userId, status: 'PENDING' }
    });

    for (const item of items) {
      await tx.orderItem.create({
        data: { orderId: order.id, ...item }
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    return tx.order.findUnique({
      where: { id: order.id },
      include: { items: true }
    });
  });
}
```

```typescript
// test/order.test.ts
it('should rollback on insufficient stock', async () => {
  const product = await prisma.product.create({
    data: { name: 'Test Product', price: 100, stock: 5 }
  });
  
  const user = await createUser();

  await expect(
    createOrder(user.id, [{ productId: product.id, quantity: 10 }])
  ).rejects.toThrow();

  // Verify no order was created
  const orders = await prisma.order.findMany({
    where: { userId: user.id }
  });
  expect(orders).toHaveLength(0);

  // Verify stock wasn't decremented
  const updatedProduct = await prisma.product.findUnique({
    where: { id: product.id }
  });
  expect(updatedProduct?.stock).toBe(5);
});
```

### 7. E2E Testing with Supertest
```typescript
// test/e2e/users.e2e.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../setup';

describe('Users API', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('POST /users', () => {
    it('should create a user', async () => {
      const response = await request(app)
        .post('/users')
        .send({ email: 'new@test.com', name: 'New User' })
        .expect(201);

      expect(response.body).toMatchObject({
        email: 'new@test.com',
        name: 'New User'
      });
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      await request(app)
        .post('/users')
        .send({ email: 'invalid', name: 'Test' })
        .expect(400);
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by id', async () => {
      const user = await prisma.user.create({
        data: { email: 'get@test.com', name: 'Get Test' }
      });

      const response = await request(app)
        .get(`/users/${user.id}`)
        .expect(200);

      expect(response.body.email).toBe('get@test.com');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/users/99999')
        .expect(404);
    });
  });
});
```

---

## Prerequisites
- Completed Section 23 (Prisma Client Advanced)
- Jest testing basics
- Docker (for test database)

## Getting Started

```bash
# Start test database
docker-compose -f docker-compose.postgres.yml up -d

# Setup demo
cd section-28-prisma-testing/demo
cp .env.example .env
pnpm install
pnpm prisma generate

# Run tests
pnpm test           # Unit tests
pnpm test:int       # Integration tests
pnpm test:e2e       # E2E tests
```

## Key Takeaways

- **Mock Prisma** for unit tests to isolate business logic
- **Use test database** for integration tests
- **Factories** reduce boilerplate in test setup
- **Clean database** before each test for isolation
- **Test transactions** to ensure rollback behavior
