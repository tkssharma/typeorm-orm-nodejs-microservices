# TypeORM CRUD with Express - Demo Project

This is a complete demo project for Section 05 of the TypeORM course.

## Features

- Complete CRUD API for Users
- Request validation with class-validator
- Pagination, filtering, and search
- Soft delete and restore
- Error handling middleware
- Database seeding

## Prerequisites

- Node.js 18+
- PostgreSQL 15+

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials

# Create database
psql -U postgres -c "CREATE DATABASE typeorm_crud_demo;"

# Run the application (creates tables automatically in dev mode)
npm run dev

# Seed sample data
npm run seed
```

## API Endpoints

| Method | Endpoint               | Description            |
| ------ | ---------------------- | ---------------------- |
| GET    | /api/users             | List users (paginated) |
| GET    | /api/users/:id         | Get user by ID         |
| POST   | /api/users             | Create user            |
| PUT    | /api/users/:id         | Update user            |
| DELETE | /api/users/:id         | Soft delete user       |
| POST   | /api/users/:id/restore | Restore deleted user   |

## Query Parameters

### GET /api/users

| Parameter | Type     | Description                     |
| --------- | -------- | ------------------------------- |
| page      | number   | Page number (default: 1)        |
| limit     | number   | Items per page (default: 10)    |
| search    | string   | Search in name/email            |
| isActive  | boolean  | Filter by active status         |
| sortBy    | string   | Sort field (default: createdAt) |
| sortOrder | ASC/DESC | Sort direction (default: DESC)  |

## Example Requests

### Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }'
```

### Get Users with Pagination

```bash
curl "http://localhost:3000/api/users?page=1&limit=10&search=john"
```

### Update User

```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane"
  }'
```

### Delete User

```bash
curl -X DELETE http://localhost:3000/api/users/1
```

### Restore User

```bash
curl -X POST http://localhost:3000/api/users/1/restore
```

## Project Structure

```
src/
├── entities/        # TypeORM entities
├── dto/             # Data Transfer Objects
├── services/        # Business logic
├── controllers/     # Request handlers
├── routes/          # Express routes
├── middleware/      # Express middleware
├── seeds/           # Database seeders
├── data-source.ts   # TypeORM configuration
├── app.ts           # Express app setup
└── index.ts         # Entry point
```
