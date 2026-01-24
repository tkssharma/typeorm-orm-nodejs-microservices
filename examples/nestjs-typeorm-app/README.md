# NestJS + TypeORM Blog Application

A comprehensive example demonstrating how to integrate TypeORM with NestJS framework. This application showcases best practices for building scalable Node.js applications.

## 📁 Project Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module with TypeORM configuration
├── database/
│   └── data-source.ts         # DataSource for CLI migrations
├── users/
│   ├── user.entity.ts         # User entity
│   ├── users.module.ts        # Users feature module
│   ├── users.controller.ts    # REST endpoints
│   ├── users.service.ts       # Business logic
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
├── posts/
│   ├── post.entity.ts         # Post entity with soft delete
│   ├── posts.module.ts
│   ├── posts.controller.ts
│   ├── posts.service.ts
│   └── dto/
│       ├── create-post.dto.ts
│       └── update-post.dto.ts
└── comments/
    ├── comment.entity.ts      # Comment with self-referencing
    ├── comments.module.ts
    ├── comments.controller.ts
    ├── comments.service.ts
    └── dto/
        └── create-comment.dto.ts
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
createdb nestjs_blog

# Run migrations
npm run migration:run
```

### Running the App

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

## 📚 Key NestJS + TypeORM Concepts

### 1. TypeORM Module Configuration

**app.module.ts** - Async configuration with ConfigService:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Always false in production!
      }),
    }),
  ],
})
export class AppModule {}
```

### 2. Feature Module with TypeORM

**users.module.ts**:

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### 3. Repository Injection

**users.service.ts**:

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}
```

### 4. DTO Validation

**create-user.dto.ts**:

```typescript
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsEmail()
  email: string;
}
```

### 5. Entity Relationships

**User → Posts (One-to-Many)**:

```typescript
@Entity('users')
export class User {
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}

@Entity('posts')
export class Post {
  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'authorId' })
  author: User;
}
```

## 🔌 API Endpoints

### Users

| Method | Endpoint              | Description     |
| ------ | --------------------- | --------------- |
| GET    | /users                | Get all users   |
| GET    | /users/:id            | Get user by ID  |
| POST   | /users                | Create user     |
| PATCH  | /users/:id            | Update user     |
| DELETE | /users/:id            | Delete user     |
| PATCH  | /users/:id/deactivate | Deactivate user |

### Posts

| Method | Endpoint           | Description         |
| ------ | ------------------ | ------------------- |
| GET    | /posts             | Get all posts       |
| GET    | /posts/published   | Get published posts |
| GET    | /posts/:id         | Get post by ID      |
| GET    | /posts/slug/:slug  | Get post by slug    |
| POST   | /posts             | Create post         |
| PATCH  | /posts/:id         | Update post         |
| PATCH  | /posts/:id/publish | Publish post        |
| PATCH  | /posts/:id/archive | Archive post        |
| DELETE | /posts/:id         | Soft delete post    |
| PATCH  | /posts/:id/restore | Restore post        |

### Comments

| Method | Endpoint               | Description           |
| ------ | ---------------------- | --------------------- |
| GET    | /comments/post/:postId | Get comments for post |
| GET    | /comments/pending      | Get pending comments  |
| GET    | /comments/:id          | Get comment by ID     |
| POST   | /comments              | Create comment        |
| PATCH  | /comments/:id/approve  | Approve comment       |
| DELETE | /comments/:id          | Delete comment        |

## 📝 Migration Commands

```bash
# Generate migration from entity changes
npm run migration:generate src/database/migrations/MigrationName

# Create empty migration
npm run migration:create src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## 🧪 Testing the API

```bash
# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe", "email": "john@example.com"}'

# Create a post
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Post", "content": "Hello World!", "authorId": 1}'

# Publish the post
curl -X PATCH http://localhost:3000/posts/1/publish

# Add a comment
curl -X POST http://localhost:3000/comments \
  -H "Content-Type: application/json" \
  -d '{"postId": 1, "authorName": "Reader", "authorEmail": "reader@example.com", "content": "Great post!"}'
```

## 🎯 NestJS + TypeORM Best Practices

1. **Use `forRootAsync`** for database configuration with environment variables
2. **Use `forFeature`** to register entities in feature modules
3. **Inject repositories** using `@InjectRepository()` decorator
4. **Use DTOs** with class-validator for request validation
5. **Enable global validation pipe** in main.ts
6. **Never use `synchronize: true`** in production - use migrations
7. **Export services** from modules when needed by other modules
8. **Use transactions** via `DataSource.transaction()` for atomic operations

## 🔗 Comparison: Express vs NestJS

| Feature    | Express + TypeORM             | NestJS + TypeORM           |
| ---------- | ----------------------------- | -------------------------- |
| Setup      | Manual DataSource             | TypeOrmModule.forRoot()    |
| Repository | AppDataSource.getRepository() | @InjectRepository()        |
| Validation | Manual or middleware          | Built-in ValidationPipe    |
| Structure  | Flexible                      | Opinionated modules        |
| DI         | Manual or library             | Built-in                   |
| Testing    | Manual setup                  | Built-in testing utilities |
