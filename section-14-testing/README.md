# Section 14: Testing Database Code

## 📚 Learning Objectives

By the end of this section, you will:

- Set up a test database
- Write unit tests for repositories
- Create integration tests
- Mock TypeORM for isolated testing
- Implement test fixtures and factories

---

## 📖 Lessons

### Lesson 14.1: Testing Setup

#### Install Testing Dependencies

```bash
npm install -D jest ts-jest @types/jest
npm install -D supertest @types/supertest
```

#### Jest Configuration

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/migrations/**', '!src/seeds/**'],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testTimeout: 30000,
};
```

#### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --config jest.e2e.config.js"
  }
}
```

---

### Lesson 14.2: Test Database Configuration

```typescript
// src/tests/test-data-source.ts
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Post } from '../entities/Post';

export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  username: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_NAME || 'typeorm_test',
  synchronize: true, // OK for tests
  dropSchema: true, // Clean slate for each test run
  logging: false,
  entities: [User, Post],
});
```

```typescript
// src/tests/setup.ts
import { TestDataSource } from './test-data-source';

beforeAll(async () => {
  await TestDataSource.initialize();
});

afterAll(async () => {
  await TestDataSource.destroy();
});

beforeEach(async () => {
  // Clear all tables before each test
  const entities = TestDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = TestDataSource.getRepository(entity.name);
    await repository.clear();
  }
});
```

---

### Lesson 14.3: Unit Testing Repositories

```typescript
// src/tests/repositories/userRepository.test.ts
import { TestDataSource } from '../test-data-source';
import { User } from '../../entities/User';
import { Repository } from 'typeorm';

describe('UserRepository', () => {
  let userRepository: Repository<User>;

  beforeAll(async () => {
    userRepository = TestDataSource.getRepository(User);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const user = userRepository.create(userData);
      const savedUser = await userRepository.save(user);

      expect(savedUser.id).toBeDefined();
      expect(savedUser.firstName).toBe('John');
      expect(savedUser.email).toBe('john@example.com');
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'duplicate@example.com',
      };

      await userRepository.save(userRepository.create(userData));

      await expect(userRepository.save(userRepository.create(userData))).rejects.toThrow();
    });
  });

  describe('find', () => {
    beforeEach(async () => {
      await userRepository.save([
        userRepository.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          isActive: true,
        }),
        userRepository.create({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          isActive: false,
        }),
      ]);
    });

    it('should find all users', async () => {
      const users = await userRepository.find();
      expect(users).toHaveLength(2);
    });

    it('should find active users only', async () => {
      const users = await userRepository.find({
        where: { isActive: true },
      });
      expect(users).toHaveLength(1);
      expect(users[0].firstName).toBe('John');
    });

    it('should find user by email', async () => {
      const user = await userRepository.findOne({
        where: { email: 'john@example.com' },
      });
      expect(user).not.toBeNull();
      expect(user?.firstName).toBe('John');
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const user = await userRepository.save(
        userRepository.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        }),
      );

      await userRepository.update(user.id, { firstName: 'Jane' });

      const updated = await userRepository.findOneBy({ id: user.id });
      expect(updated?.firstName).toBe('Jane');
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const user = await userRepository.save(
        userRepository.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        }),
      );

      await userRepository.delete(user.id);

      const deleted = await userRepository.findOneBy({ id: user.id });
      expect(deleted).toBeNull();
    });

    it('should soft delete user', async () => {
      const user = await userRepository.save(
        userRepository.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        }),
      );

      await userRepository.softDelete(user.id);

      // Not found without withDeleted
      const notFound = await userRepository.findOneBy({ id: user.id });
      expect(notFound).toBeNull();

      // Found with withDeleted
      const found = await userRepository.findOne({
        where: { id: user.id },
        withDeleted: true,
      });
      expect(found).not.toBeNull();
      expect(found?.deletedAt).not.toBeNull();
    });
  });
});
```

---

### Lesson 14.4: Testing Services

```typescript
// src/tests/services/userService.test.ts
import { TestDataSource } from '../test-data-source';
import { UserService } from '../../services/UserService';
import { User } from '../../entities/User';

describe('UserService', () => {
  let userService: UserService;

  beforeAll(() => {
    // Inject test data source
    userService = new UserService(TestDataSource);
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const result = await userService.createUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result.id).toBeDefined();
      expect(result.password).not.toBe('password123'); // Hashed
    });

    it('should throw error for duplicate email', async () => {
      await userService.createUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'duplicate@example.com',
        password: 'password123',
      });

      await expect(
        userService.createUser({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'duplicate@example.com',
          password: 'password456',
        }),
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('findUserWithPosts', () => {
    it('should return user with posts', async () => {
      // Setup
      const user = await userService.createUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      await TestDataSource.getRepository('Post').save([
        { title: 'Post 1', content: 'Content 1', author: user },
        { title: 'Post 2', content: 'Content 2', author: user },
      ]);

      // Test
      const result = await userService.findUserWithPosts(user.id);

      expect(result).not.toBeNull();
      expect(result?.posts).toHaveLength(2);
    });
  });
});
```

---

### Lesson 14.5: Integration Testing with Supertest

```typescript
// src/tests/integration/users.test.ts
import request from 'supertest';
import { TestDataSource } from '../test-data-source';
import { createApp } from '../../app';
import { Application } from 'express';

describe('Users API', () => {
  let app: Application;

  beforeAll(async () => {
    app = createApp(TestDataSource);
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Password123',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.firstName).toBe('John');
      expect(response.body.password).toBeUndefined(); // Not exposed
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          firstName: 'J', // Too short
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/users').send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'duplicate@example.com',
        password: 'Password123',
      });

      await request(app)
        .post('/api/users')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'duplicate@example.com',
          password: 'Password456',
        })
        .expect(409);
    });
  });

  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Seed test data
      await request(app).post('/api/users').send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123',
      });
      await request(app).post('/api/users').send({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'Password123',
      });
    });

    it('should return paginated users', async () => {
      const response = await request(app).get('/api/users').query({ page: 1, limit: 10 }).expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.total).toBe(2);
    });

    it('should filter by search query', async () => {
      const response = await request(app).get('/api/users').query({ search: 'john' }).expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].firstName).toBe('John');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const createResponse = await request(app).post('/api/users').send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123',
      });

      const response = await request(app).get(`/api/users/${createResponse.body.id}`).expect(200);

      expect(response.body.firstName).toBe('John');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app).get('/api/users/99999').expect(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const createResponse = await request(app).post('/api/users').send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123',
      });

      const response = await request(app)
        .put(`/api/users/${createResponse.body.id}`)
        .send({ firstName: 'Jane' })
        .expect(200);

      expect(response.body.firstName).toBe('Jane');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const createResponse = await request(app).post('/api/users').send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123',
      });

      await request(app).delete(`/api/users/${createResponse.body.id}`).expect(204);

      await request(app).get(`/api/users/${createResponse.body.id}`).expect(404);
    });
  });
});
```

---

### Lesson 14.6: Mocking TypeORM

For unit tests without database:

```typescript
// src/tests/mocks/mockRepository.ts
export const createMockRepository = <T>() => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
  })),
});
```

```typescript
// src/tests/services/userService.mock.test.ts
import { UserService } from '../../services/UserService';
import { createMockRepository } from '../mocks/mockRepository';

describe('UserService (Mocked)', () => {
  let userService: UserService;
  let mockUserRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockUserRepo = createMockRepository();
    userService = new UserService(mockUserRepo as any);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 1, firstName: 'John', email: 'john@example.com' };
      mockUserRepo.findOneBy.mockResolvedValue(mockUser);

      const result = await userService.findById(1);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);

      const result = await userService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create and return user', async () => {
      const userData = { firstName: 'John', email: 'john@example.com' };
      const createdUser = { id: 1, ...userData };

      mockUserRepo.findOneBy.mockResolvedValue(null); // No duplicate
      mockUserRepo.create.mockReturnValue(createdUser);
      mockUserRepo.save.mockResolvedValue(createdUser);

      const result = await userService.createUser(userData);

      expect(mockUserRepo.create).toHaveBeenCalledWith(userData);
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(result).toEqual(createdUser);
    });
  });
});
```

---

### Lesson 14.7: Test Fixtures and Factories

```typescript
// src/tests/factories/userFactory.ts
import { faker } from '@faker-js/faker';
import { User } from '../../entities/User';
import { DataSource } from 'typeorm';

export class UserFactory {
  constructor(private dataSource: DataSource) {}

  build(overrides: Partial<User> = {}): Partial<User> {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      isActive: true,
      ...overrides,
    };
  }

  async create(overrides: Partial<User> = {}): Promise<User> {
    const repo = this.dataSource.getRepository(User);
    const user = repo.create(this.build(overrides));
    return repo.save(user);
  }

  async createMany(count: number, overrides: Partial<User> = {}): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.create(overrides));
    }
    return users;
  }
}
```

```typescript
// src/tests/fixtures/index.ts
import { DataSource } from 'typeorm';
import { UserFactory } from '../factories/userFactory';
import { PostFactory } from '../factories/postFactory';

export class TestFixtures {
  userFactory: UserFactory;
  postFactory: PostFactory;

  constructor(dataSource: DataSource) {
    this.userFactory = new UserFactory(dataSource);
    this.postFactory = new PostFactory(dataSource);
  }

  async seedBasicData() {
    const admin = await this.userFactory.create({
      email: 'admin@example.com',
      role: 'admin',
    });

    const users = await this.userFactory.createMany(5);

    for (const user of users) {
      await this.postFactory.createMany(3, { author: user });
    }

    return { admin, users };
  }
}
```

```typescript
// Usage in tests
describe('Posts API', () => {
  let fixtures: TestFixtures;

  beforeAll(() => {
    fixtures = new TestFixtures(TestDataSource);
  });

  beforeEach(async () => {
    await fixtures.seedBasicData();
  });

  it('should list posts', async () => {
    const response = await request(app).get('/api/posts').expect(200);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
});
```

---

## 🎯 Key Takeaways

1. Use a **separate test database** with `synchronize: true`
2. **Clear tables** before each test for isolation
3. Use **factories** for generating test data
4. **Mock repositories** for pure unit tests
5. Use **supertest** for API integration tests
6. Test both **success and error** cases

---

## ✅ Quiz

1. Why use a separate test database?
2. What's the difference between unit and integration tests?
3. How do you clear all tables before each test?
4. When should you mock the repository?
5. What package is used for HTTP testing in Express?

<details>
<summary>View Answers</summary>

1. To avoid affecting development/production data and allow `synchronize: true`
2. Unit tests mock dependencies; integration tests use real database
3. Loop through entities and call `repository.clear()` for each
4. When testing business logic in isolation without database
5. supertest

</details>

---

## 📝 Homework

1. Set up Jest with a test database
2. Write unit tests for your User repository
3. Create integration tests for all CRUD endpoints
4. Implement test factories for your entities
5. Achieve 80% code coverage

---

## ➡️ Next Section

[Section 15: Capstone Project](../section-15-capstone/README.md)
