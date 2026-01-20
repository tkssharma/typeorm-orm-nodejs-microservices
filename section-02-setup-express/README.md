# Section 02: Project Setup and Configuration

## 📚 Learning Objectives

By the end of this section, you will:

- Set up a Node.js project with TypeScript
- Install and configure PostgreSQL
- Initialize TypeORM in your project
- Understand DataSource configuration options
- Set up environment variables properly
- Use the TypeORM CLI

---

## 📖 Lessons

### Lesson 2.1: Prerequisites

Before starting, ensure you have:

#### Node.js (v18+)

```bash
# Check Node.js version
node --version
# Should output v18.x.x or higher

# Check npm version
npm --version
```

#### PostgreSQL (v15+)

```bash
# Check PostgreSQL version
psql --version
# Should output psql (PostgreSQL) 15.x or higher

# Or using Docker (recommended)
docker run --name postgres-typeorm \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=typeorm_course \
  -p 5432:5432 \
  -d postgres:15
```

#### Git

```bash
git --version
```

---

### Lesson 2.2: Creating the Project

Let's create a new TypeORM project from scratch.

#### Step 1: Initialize the Project

```bash
# Create project directory
mkdir typeorm-demo
cd typeorm-demo

# Initialize npm project
npm init -y

# Install TypeScript and Node types
npm install -D typescript ts-node @types/node

# Initialize TypeScript configuration
npx tsc --init
```

#### Step 2: Configure TypeScript

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "lib": ["ES2021"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Important**: `experimentalDecorators` and `emitDecoratorMetadata` are **required** for TypeORM decorators to work!

#### Step 3: Install TypeORM and Dependencies

```bash
# Core TypeORM packages
npm install typeorm reflect-metadata

# PostgreSQL driver
npm install pg

# For environment variables
npm install dotenv

# Development dependencies
npm install -D @types/node
```

#### Step 4: Create Project Structure

```bash
mkdir -p src/{entities,migrations,repositories,subscribers}
touch src/index.ts src/data-source.ts
touch .env .env.example .gitignore
```

Your project structure should look like:

```
typeorm-demo/
├── src/
│   ├── entities/
│   ├── migrations/
│   ├── repositories/
│   ├── subscribers/
│   ├── data-source.ts
│   └── index.ts
├── .env
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

---

### Lesson 2.3: DataSource Configuration

The `DataSource` is the heart of TypeORM. It manages your database connection.

#### Create `src/data-source.ts`

```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'typeorm_course',

  // IMPORTANT: Set to false in production!
  synchronize: process.env.NODE_ENV === 'development',

  // Enable logging in development
  logging: process.env.NODE_ENV === 'development',

  // Entity files
  entities: ['src/entities/**/*.ts'],

  // Migration files
  migrations: ['src/migrations/**/*.ts'],

  // Subscriber files
  subscribers: ['src/subscribers/**/*.ts'],
});
```

#### Configuration Options Explained

| Option        | Description                                   |
| ------------- | --------------------------------------------- |
| `type`        | Database type (postgres, mysql, sqlite, etc.) |
| `host`        | Database server hostname                      |
| `port`        | Database server port                          |
| `username`    | Database user                                 |
| `password`    | Database password                             |
| `database`    | Database name                                 |
| `synchronize` | Auto-sync schema (NEVER use in production!)   |
| `logging`     | Enable SQL query logging                      |
| `entities`    | Path to entity files                          |
| `migrations`  | Path to migration files                       |
| `subscribers` | Path to subscriber files                      |

#### Additional Useful Options

```typescript
export const AppDataSource = new DataSource({
  // ... basic options above

  // Connection pool settings
  poolSize: 10,

  // Extra connection options
  extra: {
    max: 20, // Maximum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // SSL configuration (for production)
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,

  // Cache configuration
  cache: {
    type: 'database',
    tableName: 'query_cache',
  },

  // Naming strategy (optional)
  // namingStrategy: new SnakeCaseNamingStrategy(),
});
```

---

### Lesson 2.4: Environment Variables

Never hardcode database credentials! Use environment variables.

#### Create `.env`

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=typeorm_course

# Application
NODE_ENV=development
PORT=3000
```

#### Create `.env.example`

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=

# Application
NODE_ENV=development
PORT=3000
```

#### Create `.gitignore`

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Environment files
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# TypeORM
*.sqlite
```

---

### Lesson 2.5: Initializing the DataSource

#### Create `src/index.ts`

```typescript
import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function main() {
  try {
    // Initialize the DataSource
    await AppDataSource.initialize();
    console.log('✅ Database connection established successfully!');

    // Your application code here
    console.log('🚀 Application is running...');

    // Example: Check if connection is active
    if (AppDataSource.isInitialized) {
      console.log('📊 Database:', AppDataSource.options.database);
      console.log('🔌 Host:', AppDataSource.options.host);
    }
  } catch (error) {
    console.error('❌ Error during Data Source initialization:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✅ Database connection closed.');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

main();
```

---

### Lesson 2.6: Package.json Scripts

Update your `package.json` with useful scripts:

```json
{
  "name": "typeorm-demo",
  "version": "1.0.0",
  "description": "TypeORM Demo Project",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "dev:watch": "ts-node-dev --respawn src/index.ts",

    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "npm run typeorm -- migration:generate -d src/data-source.ts",
    "migration:create": "npm run typeorm -- migration:create",
    "migration:run": "npm run typeorm -- migration:run -d src/data-source.ts",
    "migration:revert": "npm run typeorm -- migration:revert -d src/data-source.ts",
    "migration:show": "npm run typeorm -- migration:show -d src/data-source.ts",

    "schema:sync": "npm run typeorm -- schema:sync -d src/data-source.ts",
    "schema:drop": "npm run typeorm -- schema:drop -d src/data-source.ts"
  },
  "keywords": ["typeorm", "typescript", "postgres"],
  "author": "",
  "license": "ISC"
}
```

---

### Lesson 2.7: TypeORM CLI

TypeORM comes with a powerful CLI for common tasks.

#### CLI Commands Reference

```bash
# Generate migration from entity changes
npm run migration:generate src/migrations/CreateUserTable

# Create empty migration
npm run migration:create src/migrations/AddUserIndex

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Sync schema (development only!)
npm run schema:sync

# Drop all tables (DANGEROUS!)
npm run schema:drop
```

---

### Lesson 2.8: Testing Your Setup

Let's verify everything works:

#### 1. Create the Database

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE typeorm_course;"

# Or using Docker
docker exec -it postgres-typeorm psql -U postgres -c "CREATE DATABASE typeorm_course;"
```

#### 2. Run the Application

```bash
npm run dev
```

You should see:

```
✅ Database connection established successfully!
🚀 Application is running...
📊 Database: typeorm_course
🔌 Host: localhost
```

---

## 🎯 Key Takeaways

1. **reflect-metadata** must be imported at the entry point
2. **experimentalDecorators** and **emitDecoratorMetadata** are required in tsconfig.json
3. **Never use synchronize: true in production** - use migrations instead
4. Use **environment variables** for all configuration
5. Always implement **graceful shutdown** to close database connections
6. The **TypeORM CLI** helps with migrations and schema management

---

## ✅ Quiz

1. What two TypeScript compiler options are required for TypeORM decorators?
2. Why should you never use `synchronize: true` in production?
3. What package is required for TypeORM decorators to work at runtime?
4. What is the purpose of the DataSource in TypeORM?
5. How do you run pending migrations using the CLI?

<details>
<summary>View Answers</summary>

1. `experimentalDecorators` and `emitDecoratorMetadata`
2. It can cause data loss by automatically modifying the schema
3. `reflect-metadata`
4. It manages database connection and configuration
5. `npm run migration:run` or `npx typeorm migration:run -d src/data-source.ts`

</details>

---

## 📝 Homework

1. Set up a new TypeORM project following this guide
2. Create a PostgreSQL database using Docker
3. Verify the connection works by running the application
4. Experiment with different logging options
5. Try connecting to a non-existent database and observe the error

---

## 📚 Further Reading

- [TypeORM DataSource Options](https://typeorm.io/data-source-options)
- [TypeORM CLI](https://typeorm.io/using-cli)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)

---

## ➡️ Next Section

[Section 03: Entities, Columns, and Decorators](../section-03-entities/README.md)
