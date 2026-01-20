# Section 05: CRUD APIs with TypeORM + Express

## 📚 Learning Objectives

By the end of this section, you will:

- Set up Express with TypeORM
- Build complete RESTful CRUD endpoints
- Implement request validation
- Handle errors properly
- Structure your application for scalability

---

## 📖 Lessons

### Lesson 5.1: Project Setup

#### Install Dependencies

```bash
npm install express cors helmet
npm install -D @types/express @types/cors
```

#### Project Structure

```
src/
├── entities/
│   └── User.ts
├── routes/
│   └── userRoutes.ts
├── controllers/
│   └── userController.ts
├── services/
│   └── userService.ts
├── middleware/
│   ├── errorHandler.ts
│   └── validateRequest.ts
├── dto/
│   └── userDto.ts
├── data-source.ts
├── app.ts
└── index.ts
```

---

### Lesson 5.2: Setting Up Express with TypeORM

#### `src/app.ts`

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { userRoutes } from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/users', userRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
```

#### `src/index.ts`

```typescript
import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { createApp } from './app';

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    // Initialize database
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Create and start Express app
    const app = createApp();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await AppDataSource.destroy();
  process.exit(0);
});

main();
```

---

### Lesson 5.3: Entity Definition

#### `src/entities/User.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

### Lesson 5.4: DTOs (Data Transfer Objects)

#### `src/dto/userDto.ts`

```typescript
// Request DTOs
export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
}

// Response DTOs
export interface UserResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

### Lesson 5.5: Service Layer

#### `src/services/userService.ts`

```typescript
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { CreateUserDto, UpdateUserDto, PaginatedResponse } from '../dto/userDto';

const userRepository = AppDataSource.getRepository(User);

export class UserService {
  async findAll(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    const [users, total] = await userRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number): Promise<User | null> {
    return userRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return userRepository.findOneBy({ email });
  }

  async create(dto: CreateUserDto): Promise<User> {
    // Check if email exists
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const user = userRepository.create(dto);
    return userRepository.save(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check email uniqueness if updating email
    if (dto.email && dto.email !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) {
        throw new Error('Email already in use');
      }
    }

    Object.assign(user, dto);
    return userRepository.save(user);
  }

  async delete(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    await userRepository.remove(user);
  }
}

export const userService = new UserService();
```

---

### Lesson 5.6: Controller Layer

#### `src/controllers/userController.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';

export class UserController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await userService.findAll(page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const user = await userService.findById(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const user = await userService.update(id, req.body);
      res.json(user);
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'Email already in use') {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await userService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  }
}

export const userController = new UserController();
```

---

### Lesson 5.7: Routes

#### `src/routes/userRoutes.ts`

```typescript
import { Router } from 'express';
import { userController } from '../controllers/userController';

const router = Router();

// GET /api/users - Get all users (paginated)
router.get('/', (req, res, next) => userController.getAll(req, res, next));

// GET /api/users/:id - Get user by ID
router.get('/:id', (req, res, next) => userController.getById(req, res, next));

// POST /api/users - Create new user
router.post('/', (req, res, next) => userController.create(req, res, next));

// PUT /api/users/:id - Update user
router.put('/:id', (req, res, next) => userController.update(req, res, next));

// PATCH /api/users/:id - Partial update
router.patch('/:id', (req, res, next) => userController.update(req, res, next));

// DELETE /api/users/:id - Delete user
router.delete('/:id', (req, res, next) => userController.delete(req, res, next));

export { router as userRoutes };
```

---

### Lesson 5.8: Error Handling Middleware

#### `src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

// Custom error class
export class HttpError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common errors
export class NotFoundError extends HttpError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}
```

---

### Lesson 5.9: Request Validation

#### Install class-validator

```bash
npm install class-validator class-transformer
```

#### `src/dto/userDto.ts` (with validation)

```typescript
import { IsEmail, IsNotEmpty, IsOptional, IsBoolean, Length } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'First name is required' })
  @Length(2, 100, { message: 'First name must be 2-100 characters' })
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @Length(2, 100, { message: 'Last name must be 2-100 characters' })
  lastName: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}

export class UpdateUserDto {
  @IsOptional()
  @Length(2, 100)
  firstName?: string;

  @IsOptional()
  @Length(2, 100)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

#### `src/middleware/validateRequest.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export function validateRequest(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(dtoClass, req.body);
    const errors = await validate(dtoInstance);

    if (errors.length > 0) {
      const messages = errors.map((error) => {
        return Object.values(error.constraints || {}).join(', ');
      });

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
```

#### Updated Routes with Validation

```typescript
import { Router } from 'express';
import { userController } from '../controllers/userController';
import { validateRequest } from '../middleware/validateRequest';
import { CreateUserDto, UpdateUserDto } from '../dto/userDto';

const router = Router();

router.get('/', (req, res, next) => userController.getAll(req, res, next));
router.get('/:id', (req, res, next) => userController.getById(req, res, next));

router.post('/', validateRequest(CreateUserDto), (req, res, next) => userController.create(req, res, next));

router.put('/:id', validateRequest(UpdateUserDto), (req, res, next) => userController.update(req, res, next));

router.delete('/:id', (req, res, next) => userController.delete(req, res, next));

export { router as userRoutes };
```

---

### Lesson 5.10: Testing the API

#### Using cURL

```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe", "email": "john@example.com"}'

# Get all users
curl http://localhost:3000/api/users

# Get user by ID
curl http://localhost:3000/api/users/1

# Update user
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Jane"}'

# Delete user
curl -X DELETE http://localhost:3000/api/users/1
```

---

## 🎯 Key Takeaways

1. **Layer your application**: Routes → Controllers → Services → Repository
2. Use **DTOs** for input validation and response shaping
3. Implement **centralized error handling**
4. Use **class-validator** for request validation
5. Always **validate and sanitize** user input
6. Return appropriate **HTTP status codes**

---

## ✅ Quiz

1. What's the purpose of the service layer?
2. Why use DTOs instead of passing entities directly?
3. What HTTP status code should you return for a created resource?
4. How do you implement pagination in TypeORM?
5. What middleware should be registered last in Express?

<details>
<summary>View Answers</summary>

1. To encapsulate business logic and database operations, keeping controllers thin
2. To control what data is exposed, validate input, and decouple API from database schema
3. 201 Created
4. Use `skip` and `take` options with `findAndCount()`
5. Error handling middleware

</details>

---

## 📝 Homework

1. Add a `Product` entity and create full CRUD endpoints
2. Implement search functionality (filter by name, email)
3. Add sorting options to the list endpoint
4. Create a `POST /api/users/bulk` endpoint for creating multiple users

---

## ➡️ Next Section

[Section 06: Migrations](../section-06-migrations/README.md)
