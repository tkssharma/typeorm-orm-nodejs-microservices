# Section 06: Migrations

## 📚 Learning Objectives

By the end of this section, you will:

- Understand why migrations are essential
- Generate migrations from entity changes
- Create manual migrations
- Run and revert migrations
- Handle migrations in production

---

## 📖 Lessons

### Lesson 6.1: Why Migrations Matter

**Migrations** are version-controlled database schema changes. They track how your database evolves over time.

#### Without Migrations (Bad Practice)

```typescript
// data-source.ts
synchronize: true; // ⚠️ DANGEROUS in production!
```

**Problems with `synchronize: true`:**

- Can drop columns/tables unexpectedly
- No history of changes
- Can't rollback
- Data loss risk
- No team coordination

#### With Migrations (Best Practice)

```typescript
// data-source.ts
synchronize: false,
migrations: ["src/migrations/*.ts"],
```

**Benefits:**

- ✅ Version controlled schema changes
- ✅ Reversible changes
- ✅ Team coordination
- ✅ Production safe
- ✅ Audit trail

---

### Lesson 6.2: Migration Configuration

#### `src/data-source.ts`

```typescript
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'typeorm_course',

  synchronize: false, // Always false!
  logging: true,

  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
});
```

#### Package.json Scripts

```json
{
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "npm run typeorm -- migration:generate -d src/data-source.ts",
    "migration:create": "npm run typeorm -- migration:create",
    "migration:run": "npm run typeorm -- migration:run -d src/data-source.ts",
    "migration:revert": "npm run typeorm -- migration:revert -d src/data-source.ts",
    "migration:show": "npm run typeorm -- migration:show -d src/data-source.ts"
  }
}
```

---

### Lesson 6.3: Generating Migrations

TypeORM can automatically generate migrations by comparing your entities to the database.

#### Step 1: Create/Modify Entity

```typescript
// src/entities/User.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### Step 2: Generate Migration

```bash
npm run migration:generate src/migrations/CreateUserTable
```

This creates a file like `src/migrations/1234567890123-CreateUserTable.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1234567890123 implements MigrationInterface {
  name = 'CreateUserTable1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "firstName" character varying(100) NOT NULL,
        "lastName" character varying(100) NOT NULL,
        "email" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
```

---

### Lesson 6.4: Creating Manual Migrations

Sometimes you need migrations that TypeORM can't auto-generate.

```bash
npm run migration:create src/migrations/AddUserIndex
```

Creates an empty migration:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIndex1234567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add your migration logic here
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add your rollback logic here
  }
}
```

#### Example: Adding an Index

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIndex1234567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_users_email"
    `);
  }
}
```

---

### Lesson 6.5: Running Migrations

#### Run All Pending Migrations

```bash
npm run migration:run
```

Output:

```
query: SELECT * FROM "migrations"
query: START TRANSACTION
query: CREATE TABLE "users" ...
query: INSERT INTO "migrations" ...
query: COMMIT
Migration CreateUserTable1234567890123 has been executed successfully.
```

#### Show Migration Status

```bash
npm run migration:show
```

Output:

```
[X] CreateUserTable1234567890123
[ ] AddUserIndex1234567890124
```

- `[X]` = Already executed
- `[ ]` = Pending

---

### Lesson 6.6: Reverting Migrations

#### Revert Last Migration

```bash
npm run migration:revert
```

This runs the `down()` method of the last executed migration.

#### Revert Multiple Migrations

Run the revert command multiple times:

```bash
npm run migration:revert
npm run migration:revert
npm run migration:revert
```

---

### Lesson 6.7: Migration Best Practices

#### 1. Always Test Migrations

```bash
# Run migrations
npm run migration:run

# Verify it works
npm run dev

# Revert and re-run to test rollback
npm run migration:revert
npm run migration:run
```

#### 2. Never Edit Executed Migrations

Once a migration has been run in any environment, **never modify it**. Create a new migration instead.

```bash
# Wrong: Editing existing migration
# Right: Create new migration
npm run migration:generate src/migrations/FixUserTable
```

#### 3. Keep Migrations Small

```typescript
// Good: One change per migration
export class AddUserAge implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE "users" ADD "age" integer`);
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "age"`);
  }
}
```

#### 4. Use Transactions

Migrations run in transactions by default. For operations that can't be in transactions:

```typescript
export class CreateExtension implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Some operations can't run in transactions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }
}
```

#### 5. Handle Data Migrations Carefully

```typescript
export class MigrateUserNames implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    // Add new column
    await queryRunner.query(`
      ALTER TABLE "users" ADD "fullName" varchar(200)
    `);

    // Migrate data
    await queryRunner.query(`
      UPDATE "users" SET "fullName" = "firstName" || ' ' || "lastName"
    `);

    // Make column required
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "fullName" SET NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "fullName"
    `);
  }
}
```

---

### Lesson 6.8: Using QueryRunner API

The `QueryRunner` provides methods for schema manipulation:

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex, TableColumn } from 'typeorm';

export class CreateProductTable implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table using Table API
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true, // ifNotExists
    );

    // Add index
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_name',
        columnNames: ['name'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('products', 'IDX_products_name');
    await queryRunner.dropTable('products');
  }
}
```

#### Common QueryRunner Methods

```typescript
// Tables
await queryRunner.createTable(table);
await queryRunner.dropTable("tableName");
await queryRunner.renameTable("oldName", "newName");

// Columns
await queryRunner.addColumn("table", new TableColumn({ ... }));
await queryRunner.dropColumn("table", "columnName");
await queryRunner.changeColumn("table", "oldColumn", newColumn);
await queryRunner.renameColumn("table", "oldName", "newName");

// Indexes
await queryRunner.createIndex("table", new TableIndex({ ... }));
await queryRunner.dropIndex("table", "indexName");

// Foreign Keys
await queryRunner.createForeignKey("table", new TableForeignKey({ ... }));
await queryRunner.dropForeignKey("table", "foreignKeyName");

// Raw queries
await queryRunner.query("SELECT * FROM users");
```

---

### Lesson 6.9: Migrations in Production

#### Production Workflow

```bash
# 1. Development: Generate migration
npm run migration:generate src/migrations/AddFeature

# 2. Test locally
npm run migration:run
npm run migration:revert
npm run migration:run

# 3. Commit migration file
git add src/migrations/
git commit -m "Add migration for new feature"

# 4. Deploy and run in production
npm run migration:run
```

#### Production Configuration

```typescript
// src/data-source.ts
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL, // Use connection string in production

  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',

  // Use compiled JS in production
  entities: [process.env.NODE_ENV === 'production' ? 'dist/entities/**/*.js' : 'src/entities/**/*.ts'],
  migrations: [process.env.NODE_ENV === 'production' ? 'dist/migrations/**/*.js' : 'src/migrations/**/*.ts'],

  // SSL for production
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
});
```

#### Docker Entrypoint

```bash
#!/bin/bash
# docker-entrypoint.sh

# Run migrations
npm run migration:run

# Start application
npm start
```

---

## 🎯 Key Takeaways

1. **Never use `synchronize: true`** in production
2. **Generate migrations** when entities change
3. **Create manual migrations** for indexes, data changes
4. **Test migrations** by running and reverting
5. **Never edit** executed migrations
6. Keep migrations **small and focused**

---

## ✅ Quiz

1. Why is `synchronize: true` dangerous in production?
2. What's the difference between `migration:generate` and `migration:create`?
3. What does the `down()` method do?
4. How do you check which migrations have been executed?
5. Should you edit a migration after it's been run in production?

<details>
<summary>View Answers</summary>

1. It can automatically drop columns/tables, causing data loss
2. `generate` compares entities to DB and creates SQL; `create` makes an empty migration
3. It reverses the changes made in `up()`, used for rollback
4. `npm run migration:show`
5. Never - create a new migration instead

</details>

---

## 📝 Homework

1. Create an entity and generate a migration for it
2. Run the migration, then revert it
3. Create a manual migration to add an index
4. Practice the full workflow: entity change → generate → run → verify

---

## ➡️ Next Section

[Section 07: Relationships](../section-07-relationships/README.md)
