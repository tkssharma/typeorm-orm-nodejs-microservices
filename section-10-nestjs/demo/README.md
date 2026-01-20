# Section 10: TypeORM with NestJS

This demo shows how to integrate TypeORM with NestJS framework.

## Features

- **@nestjs/typeorm** integration
- **ConfigModule** for environment variables
- **ValidationPipe** with class-validator
- Complete CRUD for Users module

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module with TypeORM config
└── users/
    ├── users.module.ts     # Users feature module
    ├── users.controller.ts # REST endpoints
    ├── users.service.ts    # Business logic
    ├── entities/
    │   └── user.entity.ts  # TypeORM entity
    └── dto/
        ├── create-user.dto.ts
        └── update-user.dto.ts
```

## Setup

```bash
# From monorepo root
pnpm install

# Copy environment file
cp .env.example .env

# Run the app
pnpm dev:10
# Or from this folder
pnpm dev
```

## API Endpoints

| Method | Endpoint   | Description    |
| ------ | ---------- | -------------- |
| POST   | /users     | Create user    |
| GET    | /users     | Get all users  |
| GET    | /users/:id | Get user by ID |
| PATCH  | /users/:id | Update user    |
| DELETE | /users/:id | Delete user    |

## Example Requests

### Create User

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe", "email": "john@example.com"}'
```

### Get All Users

```bash
curl http://localhost:3000/users
```

### Update User

```bash
curl -X PATCH http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Jane"}'
```

## Key NestJS + TypeORM Concepts

### 1. TypeOrmModule.forRootAsync

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    // ...
  }),
});
```

### 2. TypeOrmModule.forFeature

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
})
export class UsersModule {}
```

### 3. Repository Injection

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
}
```
