# Section 06: TypeORM CLI

## Topics Covered

### 1. TypeORM CLI Setup
- Installing TypeORM CLI globally vs locally
- Configuring `typeorm-ts-node-commonjs` for TypeScript projects
- Understanding data source configuration

### 2. Migration Commands
- `migration:create` - Create an empty migration file
- `migration:generate` - Auto-generate migration from entity changes
- `migration:run` - Execute pending migrations
- `migration:revert` - Revert the last migration
- `migration:show` - Show all migrations and their status

### 3. Schema Commands
- `schema:sync` - Sync database schema with entities (dangerous in prod!)
- `schema:drop` - Drop all tables in the database
- `schema:log` - Show SQL queries that would be executed by sync

### 4. Entity Commands
- `entity:create` - Generate a new entity file

### 5. Cache Commands
- `cache:clear` - Clear query result cache

## CLI Command Reference

```bash
# Migration Commands
pnpm typeorm migration:create src/migrations/CreateUsersTable
pnpm typeorm migration:generate src/migrations/AddEmailToUsers -d src/data-source.ts
pnpm typeorm migration:run -d src/data-source.ts
pnpm typeorm migration:revert -d src/data-source.ts
pnpm typeorm migration:show -d src/data-source.ts

# Schema Commands
pnpm typeorm schema:sync -d src/data-source.ts
pnpm typeorm schema:drop -d src/data-source.ts
pnpm typeorm schema:log -d src/data-source.ts

# Entity Commands
pnpm typeorm entity:create src/entities/Product

# Cache Commands
pnpm typeorm cache:clear -d src/data-source.ts
```

## Best Practices

1. **Never use `synchronize: true` in production** - Use migrations instead
2. **Always review generated migrations** before running them
3. **Test migrations in staging** before production
4. **Keep migrations small and focused** - One logical change per migration
5. **Never modify a migration** that has already been executed
6. **Use meaningful migration names** that describe the change

## Demo Project

See the `demo/` folder for a working example demonstrating:
- Setting up TypeORM CLI with TypeScript
- Creating and running migrations
- Generating migrations from entity changes
- Reverting migrations
- Schema management commands
