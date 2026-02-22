## Prisma CLI Commands Explained

| Command                     | Description                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`prisma init`**           | Initialize Prisma in your project. Creates [prisma/schema.prisma](cci:7://file:///Users/tkssharma/Youtube%202026/CODE%20WITH%20TKSSHARMA/typeorm-orm-nodejs-microservices/section-16-prisma-intro/demo/prisma/schema.prisma:0:0-0:0) and [.env](cci:7://file:///Users/tkssharma/Youtube%202026/CODE%20WITH%20TKSSHARMA/typeorm-orm-nodejs-microservices/section-16-prisma-intro/demo/.env:0:0-0:0) file |
| **`prisma generate`**       | Generate Prisma Client from your schema. Run after schema changes                                                                                                                                                                                                                                                                                                                                       |
| **`prisma migrate dev`**    | Create + apply migrations in **development**. Creates SQL migration files and updates DB                                                                                                                                                                                                                                                                                                                |
| **`prisma migrate deploy`** | Apply pending migrations in **production**. Does NOT create new migrations                                                                                                                                                                                                                                                                                                                              |
| **`prisma migrate reset`**  | Drop database, re-run all migrations, and seed. **Deletes all data!**                                                                                                                                                                                                                                                                                                                                   |
| **`prisma db push`**        | Push schema to DB **without** creating migration files. Good for prototyping                                                                                                                                                                                                                                                                                                                            |
| **`prisma db pull`**        | Introspect existing DB and update [schema.prisma](cci:7://file:///Users/tkssharma/Youtube%202026/CODE%20WITH%20TKSSHARMA/typeorm-orm-nodejs-microservices/section-16-prisma-intro/demo/prisma/schema.prisma:0:0-0:0). Reverse-engineer DB schema                                                                                                                                                        |
| **`prisma studio`**         | Open visual DB browser at `http://localhost:5555`                                                                                                                                                                                                                                                                                                                                                       |
| **`prisma format`**         | Format [schema.prisma](cci:7://file:///Users/tkssharma/Youtube%202026/CODE%20WITH%20TKSSHARMA/typeorm-orm-nodejs-microservices/section-16-prisma-intro/demo/prisma/schema.prisma:0:0-0:0) file                                                                                                                                                                                                          |

### When to Use What

```
Development Flow:
1. prisma init          → Start new project
2. Edit schema.prisma   → Define models
3. prisma migrate dev   → Create migration + generate client
4. prisma studio        → View/edit data visually

Production Flow:
1. prisma migrate deploy → Apply migrations
2. prisma generate       → Generate client

Prototyping (no migrations):
1. Edit schema.prisma
2. prisma db push        → Sync schema to DB
3. prisma generate       → Generate client
```
