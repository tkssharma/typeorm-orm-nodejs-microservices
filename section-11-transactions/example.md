Alright, let’s break **TypeORM transactions in NestJS** in a way that’s _practical_ and actually usable in real apps 👇

I’ll show you **all common patterns**, from basic to production-grade.

---

## 1️⃣ Basic Transaction using `DataSource` (Recommended)

This is the **cleanest and most used** approach in NestJS with TypeORM ≥ 0.3.x.

### Service example

```ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './user.entity';
import { Profile } from './profile.entity';

@Injectable()
export class UserService {
  constructor(private readonly dataSource: DataSource) {}

  async createUserWithProfile() {
    return this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: 'test@mail.com',
      });
      await manager.save(user);

      const profile = manager.create(Profile, {
        userId: user.id,
        bio: 'Hello NestJS',
      });
      await manager.save(profile);

      return user;
    });
  }
}
```

### ✅ Why this is best

- Auto commit on success
- Auto rollback on error
- No manual cleanup
- Works perfectly with NestJS DI

---

## 2️⃣ Manual Transaction (QueryRunner) – Full Control

Use this when you need **fine-grained control** (multiple steps, condition-based commits).

### Example

```ts
import { DataSource } from 'typeorm';

async createUserManual() {
  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const user = queryRunner.manager.create(User, {
      email: 'manual@mail.com',
    });
    await queryRunner.manager.save(user);

    await queryRunner.commitTransaction();
    return user;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
```

### Use when

- Multiple conditional flows
- External API calls in between
- Long-running business logic

---

## 3️⃣ Transaction Across Multiple Services (Advanced)

❌ **Wrong approach**

```ts
this.userService.createUser();
this.orderService.createOrder();
```

(Each service uses its own repository → no shared transaction)

---

### ✅ Correct Way – Pass EntityManager

#### Service A

```ts
async createUser(manager: EntityManager) {
  const user = manager.create(User, {});
  return manager.save(user);
}
```

#### Service B

```ts
async createOrder(manager: EntityManager, userId: number) {
  const order = manager.create(Order, { userId });
  return manager.save(order);
}
```

#### Orchestrator Service

```ts
this.dataSource.transaction(async (manager) => {
  const user = await this.userService.createUser(manager);
  await this.orderService.createOrder(manager, user.id);
});
```

🔥 This is **enterprise-grade NestJS design**

---

## 4️⃣ Transaction with Repository (Inside Transaction)

❌ Don’t use injected repositories inside a transaction
✅ Use `manager.getRepository()`

```ts
this.dataSource.transaction(async (manager) => {
  const userRepo = manager.getRepository(User);
  await userRepo.save({ email: 'repo@mail.com' });
});
```

---

## 5️⃣ Rollback Automatically on Error

```ts
await this.dataSource.transaction(async (manager) => {
  await manager.save(User, { email: 'ok@mail.com' });
  throw new Error('Something failed'); // rollback happens
});
```

---

## 6️⃣ Common Mistakes (Very Important)

❌ Using injected repository inside transaction
❌ Mixing `Repository` and `EntityManager`
❌ Forgetting `queryRunner.release()`
❌ Calling another service without passing `EntityManager`

---

## 7️⃣ When NOT to use Transactions

- Single insert/update
- Read-only operations
- High-traffic hot paths (unless required)

---

## 8️⃣ Interview One-Liner (Steal This 😄)

> “In NestJS with TypeORM, transactions should be handled using `DataSource.transaction()` and shared via `EntityManager` across services to maintain atomicity.”

---

If you want, I can also:

- 🔹 Show **transaction with async/await pitfalls**
- 🔹 Build a **real e-commerce transaction example**
- 🔹 Explain **transactions vs saga pattern**
- 🔹 Add this as a **Udemy slide + diagram**

Just tell me 👌
