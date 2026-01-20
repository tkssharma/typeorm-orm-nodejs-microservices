# Section 02: Express + TypeORM Setup

A basic Express.js REST API with TypeORM demonstrating CRUD operations.

## Project Structure

```
src/
├── data-source.ts    # TypeORM DataSource configuration
├── entities/
│   └── User.ts       # User entity
└── index.ts          # Express app with REST endpoints
```

## Setup

```bash
# From monorepo root
pnpm install

# Copy environment file
cp .env.example .env

# Run the server
pnpm dev:02-express
# Or from this folder
pnpm dev
```

## API Endpoints

| Method | Endpoint   | Description    |
| ------ | ---------- | -------------- |
| GET    | /health    | Health check   |
| GET    | /users     | Get all users  |
| GET    | /users/:id | Get user by ID |
| POST   | /users     | Create user    |
| PUT    | /users/:id | Update user    |
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

### Get User by ID

```bash
curl http://localhost:3000/users/1
```

### Update User

```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Jane"}'
```

### Delete User

```bash
curl -X DELETE http://localhost:3000/users/1
```

## Key Concepts

### Express + TypeORM Integration

```typescript
// Initialize TypeORM first, then start Express
AppDataSource.initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
```

### Using Repository in Routes

```typescript
app.get('/users', async (req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const users = await userRepository.find();
  res.json(users);
});
```
