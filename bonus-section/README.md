# Bonus Section: Comparisons and Advanced Patterns

## 📚 Topics Covered

- TypeORM vs Sequelize vs Prisma
- TypeORM v0.3+ syntax changes
- Multi-tenant architecture
- Migrations in CI/CD
- Repository vs DataSource APIs

---

## 🔄 TypeORM vs Sequelize vs Prisma

### Feature Comparison

| Feature               | TypeORM                     | Sequelize         | Prisma            |
| --------------------- | --------------------------- | ----------------- | ----------------- |
| **Language**          | TypeScript-first            | JavaScript-first  | TypeScript-first  |
| **Pattern**           | Active Record & Data Mapper | Active Record     | Data Mapper       |
| **Schema Definition** | Decorators                  | Models/Migrations | Schema file (DSL) |
| **Type Safety**       | Good                        | Limited           | Excellent         |
| **Query Builder**     | Yes                         | Yes               | Limited           |
| **Raw SQL**           | Yes                         | Yes               | Yes               |
| **Migrations**        | Built-in                    | Built-in          | Built-in          |
| **Relations**         | Decorators                  | Methods           | Schema            |
| **Learning Curve**    | Medium                      | Medium            | Low               |
| **Performance**       | Good                        | Good              | Excellent         |
| **Bundle Size**       | Large                       | Medium            | Medium            |

### Code Comparison

#### TypeORM

```typescript
// Entity
@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}

// Query
const users = await userRepository.find({
  relations: ['posts'],
  where: { isActive: true },
});
```

#### Sequelize

```typescript
// Model
class User extends Model {
  declare id: number;
  declare email: string;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING },
  },
  { sequelize },
);

User.hasMany(Post, { foreignKey: 'authorId' });

// Query
const users = await User.findAll({
  include: [Post],
  where: { isActive: true },
});
```

#### Prisma

```prisma
// schema.prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  author   User @relation(fields: [authorId], references: [id])
  authorId Int
}
```

```typescript
// Query
const users = await prisma.user.findMany({
  include: { posts: true },
  where: { isActive: true },
});
```

### When to Choose

| Choose        | When                                                           |
| ------------- | -------------------------------------------------------------- |
| **TypeORM**   | Need flexibility, decorator-based, existing TypeScript project |
| **Sequelize** | JavaScript project, familiar with ActiveRecord                 |
| **Prisma**    | New project, want best type safety, simpler API                |

---

## 📝 TypeORM v0.3+ Syntax Changes

### Connection → DataSource

```typescript
// v0.2.x (deprecated)
import { createConnection, getConnection, getRepository } from "typeorm";

const connection = await createConnection({...});
const userRepo = getRepository(User);

// v0.3.x (current)
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({...});
await AppDataSource.initialize();
const userRepo = AppDataSource.getRepository(User);
```

### Custom Repositories

```typescript
// v0.2.x (deprecated)
@EntityRepository(User)
class UserRepository extends Repository<User> {
  findByEmail(email: string) {
    return this.findOne({ where: { email } });
  }
}

const userRepo = getCustomRepository(UserRepository);

// v0.3.x (current)
export const UserRepository = AppDataSource.getRepository(User).extend({
  findByEmail(email: string) {
    return this.findOne({ where: { email } });
  },
});
```

### Find Options

```typescript
// v0.2.x
const user = await userRepo.findOne(1);
const user = await userRepo.findOne({ email: 'test@example.com' });

// v0.3.x
const user = await userRepo.findOneBy({ id: 1 });
const user = await userRepo.findOne({ where: { email: 'test@example.com' } });
```

### Migration from v0.2 to v0.3

1. Replace `createConnection` with `new DataSource().initialize()`
2. Replace `getRepository` with `dataSource.getRepository`
3. Replace `@EntityRepository` with `.extend()`
4. Update `findOne(id)` to `findOneBy({ id })`
5. Remove `getConnection()` calls

---

## 🏢 Multi-Tenant Architecture

### Strategy 1: Separate Databases

```typescript
// Tenant-specific data sources
const tenantDataSources: Map<string, DataSource> = new Map();

async function getTenantDataSource(tenantId: string): Promise<DataSource> {
  if (tenantDataSources.has(tenantId)) {
    return tenantDataSources.get(tenantId)!;
  }

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    database: `tenant_${tenantId}`,
    // ... other options
  });

  await dataSource.initialize();
  tenantDataSources.set(tenantId, dataSource);
  return dataSource;
}

// Middleware
app.use(async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  req.dataSource = await getTenantDataSource(tenantId);
  next();
});
```

### Strategy 2: Shared Database with Tenant Column

```typescript
// Base entity with tenant
export abstract class TenantEntity {
  @Column()
  tenantId: string;
}

@Entity()
export class User extends TenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;
}

// Repository with tenant filter
export const createTenantRepository = <T extends TenantEntity>(entity: new () => T, tenantId: string) => {
  return AppDataSource.getRepository(entity).extend({
    findAll() {
      return this.find({ where: { tenantId } as any });
    },

    findById(id: number) {
      return this.findOne({ where: { id, tenantId } as any });
    },

    createForTenant(data: Partial<T>) {
      return this.save({ ...data, tenantId } as any);
    },
  });
};

// Usage
const userRepo = createTenantRepository(User, req.tenantId);
const users = await userRepo.findAll();
```

### Strategy 3: Schema per Tenant (PostgreSQL)

```typescript
// Set schema per request
app.use(async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  await AppDataSource.query(`SET search_path TO tenant_${tenantId}`);
  next();
});

// Create schema for new tenant
async function createTenantSchema(tenantId: string) {
  await AppDataSource.query(`CREATE SCHEMA IF NOT EXISTS tenant_${tenantId}`);

  // Run migrations for new schema
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.query(`SET search_path TO tenant_${tenantId}`);

  // Create tables...
  await queryRunner.release();
}
```

---

## 🔄 Migrations in CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run migration:run
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USERNAME: postgres
          DB_PASSWORD: postgres
          DB_DATABASE: test_db

      - name: Run tests
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Push to registry
        run: |
          docker tag myapp:${{ github.sha }} registry.example.com/myapp:${{ github.sha }}
          docker push registry.example.com/myapp:${{ github.sha }}

      - name: Deploy to production
        run: |
          # Deploy and run migrations
          ssh deploy@server "
            docker pull registry.example.com/myapp:${{ github.sha }}
            docker run --rm \
              -e DB_HOST=${{ secrets.DB_HOST }} \
              -e DB_PASSWORD=${{ secrets.DB_PASSWORD }} \
              registry.example.com/myapp:${{ github.sha }} \
              npm run migration:run:prod
            docker-compose up -d
          "
```

### Migration Safety Checks

```typescript
// scripts/check-migrations.ts
import { AppDataSource } from '../src/data-source';

async function checkMigrations() {
  await AppDataSource.initialize();

  const pendingMigrations = await AppDataSource.showMigrations();

  if (pendingMigrations) {
    console.log('⚠️ Pending migrations detected!');
    console.log('Run: npm run migration:run');
    process.exit(1);
  }

  console.log('✅ All migrations are up to date');
  await AppDataSource.destroy();
}

checkMigrations();
```

### Rollback Strategy

```yaml
# In case of failed deployment
rollback:
  runs-on: ubuntu-latest
  steps:
    - name: Revert last migration
      run: |
        ssh deploy@server "
          docker run --rm \
            -e DB_HOST=${{ secrets.DB_HOST }} \
            registry.example.com/myapp:previous \
            npm run migration:revert
        "

    - name: Deploy previous version
      run: |
        ssh deploy@server "
          docker-compose down
          docker tag myapp:previous myapp:latest
          docker-compose up -d
        "
```

---

## 🔧 Repository vs DataSource APIs

### Repository API

```typescript
// Get repository
const userRepo = AppDataSource.getRepository(User);

// CRUD operations
const users = await userRepo.find();
const user = await userRepo.findOneBy({ id: 1 });
await userRepo.save(user);
await userRepo.update(1, { name: 'New Name' });
await userRepo.delete(1);

// QueryBuilder from repository
const qb = userRepo.createQueryBuilder('user');
```

### DataSource Manager API

```typescript
// Direct manager access
const users = await AppDataSource.manager.find(User);
const user = await AppDataSource.manager.findOneBy(User, { id: 1 });
await AppDataSource.manager.save(user);

// Useful in transactions
await AppDataSource.transaction(async (manager) => {
  await manager.save(user);
  await manager.save(profile);
});
```

### When to Use Which

| Use Repository When          | Use Manager When               |
| ---------------------------- | ------------------------------ |
| Working with single entity   | Working with multiple entities |
| Building custom repositories | Inside transactions            |
| Need entity-specific methods | Need cross-entity operations   |
| Standard CRUD operations     | Complex multi-entity logic     |

### Best Practice: Service Layer

```typescript
// Combine both approaches
class UserService {
  private userRepo = AppDataSource.getRepository(User);
  private profileRepo = AppDataSource.getRepository(Profile);

  // Simple operations use repository
  async findById(id: number) {
    return this.userRepo.findOneBy({ id });
  }

  // Complex operations use transaction manager
  async createWithProfile(userData: any, profileData: any) {
    return AppDataSource.transaction(async (manager) => {
      const user = manager.create(User, userData);
      await manager.save(user);

      const profile = manager.create(Profile, {
        ...profileData,
        user,
      });
      await manager.save(profile);

      return { user, profile };
    });
  }
}
```

---

## 🎯 Key Takeaways

1. **Choose ORM based on project needs** - TypeORM for flexibility, Prisma for type safety
2. **v0.3+ uses DataSource** instead of Connection
3. **Multi-tenancy** can be database, schema, or column-based
4. **CI/CD migrations** should be automated and tested
5. **Repository for single entity**, Manager for transactions

---

## 📚 Additional Resources

- [TypeORM Official Docs](https://typeorm.io/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Sequelize Documentation](https://sequelize.org/)
- [Multi-Tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multi-tenant-saas)

---

## 🎉 Course Completion

Congratulations on completing the TypeORM course! You now have the knowledge to:

- ✅ Build production-ready applications with TypeORM
- ✅ Design and implement complex database schemas
- ✅ Handle relationships, migrations, and transactions
- ✅ Optimize performance and implement caching
- ✅ Test database code effectively
- ✅ Deploy with Docker

### Next Steps

1. Build your own project using TypeORM
2. Explore NestJS integration with TypeORM
3. Learn about database optimization techniques
4. Contribute to TypeORM open source

**Happy Coding! 🚀**
