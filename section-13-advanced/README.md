# Section 13: Advanced Topics

## 📚 Learning Objectives

By the end of this section, you will:

- Create entity subscribers and event listeners
- Use embeddable entities
- Implement custom repositories
- Validate DTOs with class-validator
- Handle multiple database connections

---

## 📖 Lessons

### Lesson 13.1: Entity Subscribers

Subscribers listen to entity events across your application.

```typescript
// src/subscribers/UserSubscriber.ts
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { User } from '../entities/User';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  // Specify which entity to listen to
  listenTo() {
    return User;
  }

  // Before insert
  beforeInsert(event: InsertEvent<User>) {
    console.log('Before insert:', event.entity);
    // Modify entity before saving
    if (event.entity.email) {
      event.entity.email = event.entity.email.toLowerCase();
    }
  }

  // After insert
  afterInsert(event: InsertEvent<User>) {
    console.log('User created:', event.entity.id);
    // Send welcome email, log activity, etc.
  }

  // Before update
  beforeUpdate(event: UpdateEvent<User>) {
    console.log('Before update:', event.entity);
  }

  // After update
  afterUpdate(event: UpdateEvent<User>) {
    console.log('User updated:', event.entity?.id);
  }

  // Before remove
  beforeRemove(event: RemoveEvent<User>) {
    console.log('Before remove:', event.entity);
  }

  // After remove
  afterRemove(event: RemoveEvent<User>) {
    console.log('User removed');
  }

  // Before soft remove
  beforeSoftRemove(event: SoftRemoveEvent<User>) {
    console.log('Before soft remove:', event.entity);
  }

  // After soft remove
  afterSoftRemove(event: SoftRemoveEvent<User>) {
    console.log('User soft removed');
  }

  // After load (when entity is loaded from DB)
  afterLoad(entity: User) {
    // Compute virtual properties
    entity.fullName = `${entity.firstName} ${entity.lastName}`;
  }
}
```

#### Register Subscribers

```typescript
// src/data-source.ts
export const AppDataSource = new DataSource({
  // ... other options
  subscribers: ['src/subscribers/**/*.ts'],
  // Or import directly
  // subscribers: [UserSubscriber],
});
```

#### Practical Use Cases

```typescript
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  // Listen to all entities
  // Don't implement listenTo() to catch all

  afterInsert(event: InsertEvent<any>) {
    this.logAudit('INSERT', event);
  }

  afterUpdate(event: UpdateEvent<any>) {
    this.logAudit('UPDATE', event);
  }

  afterRemove(event: RemoveEvent<any>) {
    this.logAudit('DELETE', event);
  }

  private async logAudit(action: string, event: any) {
    const auditRepo = event.manager.getRepository(AuditLog);
    await auditRepo.save({
      action,
      entityName: event.metadata.tableName,
      entityId: event.entity?.id,
      timestamp: new Date(),
    });
  }
}
```

---

### Lesson 13.2: Entity Listeners (Decorators)

For simpler cases, use decorator-based listeners directly on entities.

```typescript
import { Entity, BeforeInsert, BeforeUpdate, AfterInsert, AfterLoad } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  passwordChangedAt: Date;

  // Virtual property (not stored)
  fullName: string;

  @BeforeInsert()
  async hashPasswordOnInsert() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
      this.passwordChangedAt = new Date();
    }
  }

  @AfterInsert()
  logInsert() {
    console.log('User inserted with id:', this.id);
  }

  @AfterLoad()
  computeFullName() {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }
}
```

#### Available Listener Decorators

| Decorator             | When Called               |
| --------------------- | ------------------------- |
| `@BeforeInsert()`     | Before entity is inserted |
| `@AfterInsert()`      | After entity is inserted  |
| `@BeforeUpdate()`     | Before entity is updated  |
| `@AfterUpdate()`      | After entity is updated   |
| `@BeforeRemove()`     | Before entity is removed  |
| `@AfterRemove()`      | After entity is removed   |
| `@BeforeSoftRemove()` | Before soft remove        |
| `@AfterSoftRemove()`  | After soft remove         |
| `@AfterLoad()`        | After entity is loaded    |

---

### Lesson 13.3: Embeddable Entities

Embeddables are reusable column groups without separate tables.

```typescript
// src/entities/embeddables/Address.ts
import { Column } from 'typeorm';

export class Address {
  @Column({ type: 'varchar', length: 255 })
  street: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 50 })
  state: string;

  @Column({ type: 'varchar', length: 20 })
  zipCode: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;
}
```

```typescript
// src/entities/embeddables/ContactInfo.ts
import { Column } from 'typeorm';

export class ContactInfo {
  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  fax: string;

  @Column({ nullable: true })
  website: string;
}
```

```typescript
// src/entities/Company.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Address } from './embeddables/Address';
import { ContactInfo } from './embeddables/ContactInfo';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column(() => Address, { prefix: 'hq' })
  headquarters: Address;

  @Column(() => Address, { prefix: 'billing' })
  billingAddress: Address;

  @Column(() => ContactInfo)
  contact: ContactInfo;
}
```

This creates columns: `hqStreet`, `hqCity`, `billingStreet`, `billingCity`, `contactPhone`, etc.

---

### Lesson 13.4: Custom Repositories

#### Method 1: Extended Repository (Recommended for v0.3+)

```typescript
// src/repositories/UserRepository.ts
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

export const UserRepository = AppDataSource.getRepository(User).extend({
  findByEmail(email: string) {
    return this.findOne({ where: { email: email.toLowerCase() } });
  },

  findActiveUsers() {
    return this.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  },

  async findWithStats(userId: number) {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.posts', 'post')
      .loadRelationCountAndMap('user.postCount', 'user.posts')
      .loadRelationCountAndMap('user.commentCount', 'user.comments')
      .where('user.id = :userId', { userId })
      .getOne();
  },

  async searchUsers(query: string, page = 1, limit = 10) {
    const [users, total] = await this.createQueryBuilder('user')
      .where('user.firstName ILIKE :query', { query: `%${query}%` })
      .orWhere('user.lastName ILIKE :query', { query: `%${query}%` })
      .orWhere('user.email ILIKE :query', { query: `%${query}%` })
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { users, total, page, limit };
  },
});
```

#### Method 2: Repository Class

```typescript
// src/repositories/ProductRepository.ts
import { Repository, EntityManager } from 'typeorm';
import { Product } from '../entities/Product';
import { AppDataSource } from '../data-source';

export class ProductRepository {
  private repo: Repository<Product>;

  constructor(manager?: EntityManager) {
    this.repo = manager ? manager.getRepository(Product) : AppDataSource.getRepository(Product);
  }

  async findInStock() {
    return this.repo.find({
      where: { quantity: MoreThan(0), isAvailable: true },
    });
  }

  async findByCategory(category: string) {
    return this.repo.find({ where: { category } });
  }

  async updateStock(productId: number, quantity: number) {
    return this.repo.update(productId, { quantity });
  }

  async decrementStock(productId: number, amount: number) {
    return this.repo
      .createQueryBuilder()
      .update()
      .set({ quantity: () => `quantity - ${amount}` })
      .where('id = :id AND quantity >= :amount', { id: productId, amount })
      .execute();
  }
}

// Usage
const productRepo = new ProductRepository();
const inStock = await productRepo.findInStock();

// In transaction
await AppDataSource.transaction(async (manager) => {
  const productRepo = new ProductRepository(manager);
  await productRepo.decrementStock(1, 5);
});
```

---

### Lesson 13.5: DTO Validation with class-validator

```bash
npm install class-validator class-transformer
```

#### Create DTOs

```typescript
// src/dto/CreateUserDto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export class CreateUserDto {
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;
}
```

```typescript
// src/dto/UpdateUserDto.ts
import { PartialType } from 'class-transformer';
import { CreateUserDto } from './CreateUserDto';

// All fields optional
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

#### Validation Middleware

```typescript
// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export function validateDto(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(dtoClass, req.body);
    const errors = await validate(dtoInstance, {
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Error on unknown properties
    });

    if (errors.length > 0) {
      const messages = formatErrors(errors);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: messages,
      });
    }

    req.body = dtoInstance;
    next();
  };
}

function formatErrors(errors: ValidationError[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const error of errors) {
    const field = error.property;
    const messages = Object.values(error.constraints || {});
    result[field] = messages;
  }

  return result;
}
```

#### Usage in Routes

```typescript
import { validateDto } from '../middleware/validate';
import { CreateUserDto, UpdateUserDto } from '../dto/UserDto';

router.post('/', validateDto(CreateUserDto), userController.create);
router.put('/:id', validateDto(UpdateUserDto), userController.update);
```

---

### Lesson 13.6: Multiple Database Connections

```typescript
// src/data-source.ts
import { DataSource } from 'typeorm';

// Primary database
export const MainDataSource = new DataSource({
  name: 'main',
  type: 'postgres',
  host: process.env.MAIN_DB_HOST,
  database: process.env.MAIN_DB_NAME,
  entities: ['src/entities/main/**/*.ts'],
});

// Secondary database (e.g., analytics)
export const AnalyticsDataSource = new DataSource({
  name: 'analytics',
  type: 'postgres',
  host: process.env.ANALYTICS_DB_HOST,
  database: process.env.ANALYTICS_DB_NAME,
  entities: ['src/entities/analytics/**/*.ts'],
});

// Initialize both
export async function initializeDataSources() {
  await MainDataSource.initialize();
  await AnalyticsDataSource.initialize();
}
```

```typescript
// Usage
import { MainDataSource, AnalyticsDataSource } from './data-source';

// Main database
const userRepo = MainDataSource.getRepository(User);

// Analytics database
const eventRepo = AnalyticsDataSource.getRepository(AnalyticsEvent);
```

---

### Lesson 13.7: View Entities

Map database views to entities.

```typescript
// Create view in migration
await queryRunner.query(`
  CREATE VIEW "user_stats" AS
  SELECT 
    u.id,
    u."firstName",
    u."lastName",
    COUNT(p.id) as "postCount",
    COALESCE(SUM(p.views), 0) as "totalViews"
  FROM users u
  LEFT JOIN posts p ON p."authorId" = u.id
  GROUP BY u.id
`);
```

```typescript
// src/entities/UserStatsView.ts
import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'user_stats',
  expression: `
    SELECT 
      u.id,
      u."firstName",
      u."lastName",
      COUNT(p.id) as "postCount",
      COALESCE(SUM(p.views), 0) as "totalViews"
    FROM users u
    LEFT JOIN posts p ON p."authorId" = u.id
    GROUP BY u.id
  `,
})
export class UserStatsView {
  @ViewColumn()
  id: number;

  @ViewColumn()
  firstName: string;

  @ViewColumn()
  lastName: string;

  @ViewColumn()
  postCount: number;

  @ViewColumn()
  totalViews: number;
}
```

```typescript
// Usage
const statsRepo = AppDataSource.getRepository(UserStatsView);
const stats = await statsRepo.find();
```

---

## 🎯 Key Takeaways

1. **Subscribers** handle events across all operations
2. **Entity listeners** are simpler for single-entity logic
3. **Embeddables** create reusable column groups
4. **Custom repositories** encapsulate complex queries
5. **class-validator** provides robust DTO validation
6. **Multiple DataSources** support multi-database apps

---

## ✅ Quiz

1. What's the difference between subscribers and entity listeners?
2. When would you use an embeddable entity?
3. How do you create a custom repository in TypeORM v0.3+?
4. What decorator validates email format?
5. How do you connect to multiple databases?

<details>
<summary>View Answers</summary>

1. Subscribers are separate classes that can listen to multiple entities; listeners are decorators on the entity itself
2. When you have reusable column groups (like Address) used in multiple entities
3. Use `AppDataSource.getRepository(Entity).extend({ ... })`
4. `@IsEmail()`
5. Create multiple DataSource instances with different names

</details>

---

## 📝 Homework

1. Create a subscriber that logs all entity changes
2. Implement an Address embeddable and use it in multiple entities
3. Build a custom repository with search and pagination
4. Add DTO validation to all your API endpoints

---

## ➡️ Next Section

[Section 14: Testing](../section-14-testing/README.md)
