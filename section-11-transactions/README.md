# Section 11: Transactions

## 📚 Learning Objectives

By the end of this section, you will:

- Understand database transactions
- Implement transactions in TypeORM
- Handle transaction isolation levels
- Manage nested transactions
- Handle errors in transactions

---

## 📖 Lessons

### Lesson 11.1: Understanding Transactions

A **transaction** is a sequence of operations that are executed as a single unit. Either all operations succeed, or all are rolled back.

```
┌─────────────────────────────────────────────────────────────┐
│                    Transaction Properties (ACID)             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Atomicity    - All or nothing                               │
│  Consistency  - Database remains valid                       │
│  Isolation    - Transactions don't interfere                 │
│  Durability   - Committed changes persist                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### When to Use Transactions

- ✅ Transferring money between accounts
- ✅ Creating related records together
- ✅ Updating multiple tables atomically
- ✅ Any operation that must be "all or nothing"

---

### Lesson 11.2: Basic Transaction with DataSource

#### Using transaction() Method

```typescript
import { AppDataSource } from './data-source';
import { User } from './entities/User';
import { Profile } from './entities/Profile';

async function createUserWithProfile(userData: any, profileData: any) {
  await AppDataSource.transaction(async (manager) => {
    // All operations use the transaction manager
    const user = manager.create(User, userData);
    await manager.save(user);

    const profile = manager.create(Profile, {
      ...profileData,
      user: user,
    });
    await manager.save(profile);

    // If any operation fails, all are rolled back
  });
}
```

#### Transaction with Return Value

```typescript
async function createUserWithProfile(userData: any, profileData: any) {
  const result = await AppDataSource.transaction(async (manager) => {
    const user = manager.create(User, userData);
    await manager.save(user);

    const profile = manager.create(Profile, {
      ...profileData,
      user: user,
    });
    await manager.save(profile);

    return { user, profile };
  });

  return result;
}
```

---

### Lesson 11.3: Transaction with QueryRunner

For more control, use QueryRunner:

```typescript
import { AppDataSource } from './data-source';

async function transferMoney(fromId: number, toId: number, amount: number) {
  // Create a query runner
  const queryRunner = AppDataSource.createQueryRunner();

  // Establish connection
  await queryRunner.connect();

  // Start transaction
  await queryRunner.startTransaction();

  try {
    // Get accounts
    const fromAccount = await queryRunner.manager.findOneBy(Account, {
      id: fromId,
    });
    const toAccount = await queryRunner.manager.findOneBy(Account, {
      id: toId,
    });

    if (!fromAccount || !toAccount) {
      throw new Error('Account not found');
    }

    if (fromAccount.balance < amount) {
      throw new Error('Insufficient funds');
    }

    // Perform transfer
    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await queryRunner.manager.save(fromAccount);
    await queryRunner.manager.save(toAccount);

    // Commit transaction
    await queryRunner.commitTransaction();

    return { success: true, message: 'Transfer completed' };
  } catch (error) {
    // Rollback on error
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    // Release the query runner
    await queryRunner.release();
  }
}
```

---

### Lesson 11.4: Transaction Isolation Levels

Isolation levels control how transactions interact with each other.

```typescript
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

// Using transaction() with isolation level
await AppDataSource.transaction('SERIALIZABLE', async (manager) => {
  // Operations here
});

// Using QueryRunner
const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction('READ COMMITTED');
```

#### Isolation Levels Explained

| Level              | Description                          | Use Case               |
| ------------------ | ------------------------------------ | ---------------------- |
| `READ UNCOMMITTED` | Can read uncommitted changes         | Rarely used            |
| `READ COMMITTED`   | Only reads committed data            | Default for PostgreSQL |
| `REPEATABLE READ`  | Consistent reads within transaction  | Reports                |
| `SERIALIZABLE`     | Full isolation, sequential execution | Financial transactions |

#### PostgreSQL Default

```typescript
// PostgreSQL uses READ COMMITTED by default
await AppDataSource.transaction(async (manager) => {
  // Uses READ COMMITTED
});

// For stricter isolation
await AppDataSource.transaction('SERIALIZABLE', async (manager) => {
  // Full isolation
});
```

---

### Lesson 11.5: Nested Transactions (Savepoints)

```typescript
async function complexOperation() {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Main operation
    await queryRunner.manager.save(mainEntity);

    // Create savepoint for optional operation
    await queryRunner.query('SAVEPOINT optional_operation');

    try {
      // Optional operation that might fail
      await queryRunner.manager.save(optionalEntity);
    } catch (error) {
      // Rollback only the optional operation
      await queryRunner.query('ROLLBACK TO SAVEPOINT optional_operation');
      console.log('Optional operation failed, continuing...');
    }

    // Continue with main transaction
    await queryRunner.manager.save(anotherEntity);

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

### Lesson 11.6: Transaction Decorators (NestJS Style)

For cleaner code, create a transaction decorator:

```typescript
// src/utils/transactional.ts
import { AppDataSource } from '../data-source';
import { EntityManager } from 'typeorm';

export async function runInTransaction<T>(operation: (manager: EntityManager) => Promise<T>): Promise<T> {
  return AppDataSource.transaction(operation);
}

// Usage
async function createOrder(orderData: any) {
  return runInTransaction(async (manager) => {
    const order = manager.create(Order, orderData);
    await manager.save(order);

    for (const item of orderData.items) {
      const orderItem = manager.create(OrderItem, {
        ...item,
        order,
      });
      await manager.save(orderItem);

      // Update inventory
      await manager.decrement(Product, { id: item.productId }, 'quantity', item.quantity);
    }

    return order;
  });
}
```

---

### Lesson 11.7: Error Handling in Transactions

```typescript
// Custom transaction error
class TransactionError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

async function safeTransaction<T>(operation: (manager: EntityManager) => Promise<T>, errorMessage: string): Promise<T> {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const result = await operation(queryRunner.manager);
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();

    // Log the error
    console.error('Transaction failed:', error);

    // Throw wrapped error
    throw new TransactionError(errorMessage, error instanceof Error ? error : undefined);
  } finally {
    await queryRunner.release();
  }
}

// Usage
async function createUserWithProfile(data: any) {
  return safeTransaction(async (manager) => {
    const user = manager.create(User, data.user);
    await manager.save(user);

    const profile = manager.create(Profile, {
      ...data.profile,
      user,
    });
    await manager.save(profile);

    return { user, profile };
  }, 'Failed to create user with profile');
}
```

---

### Lesson 11.8: Practical Examples

#### Example 1: Order Creation

```typescript
async function createOrder(userId: number, items: OrderItemInput[]) {
  return AppDataSource.transaction(async (manager) => {
    // Validate user
    const user = await manager.findOneBy(User, { id: userId });
    if (!user) throw new Error('User not found');

    // Calculate total
    let total = 0;
    const orderItems: OrderItem[] = [];

    for (const item of items) {
      const product = await manager.findOneBy(Product, { id: item.productId });
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      total += parseFloat(product.price) * item.quantity;

      // Decrease stock
      product.quantity -= item.quantity;
      await manager.save(product);

      orderItems.push(
        manager.create(OrderItem, {
          product,
          quantity: item.quantity,
          price: product.price,
        }),
      );
    }

    // Create order
    const order = manager.create(Order, {
      user,
      total: total.toString(),
      status: 'pending',
      items: orderItems,
    });

    await manager.save(order);
    return order;
  });
}
```

#### Example 2: User Registration with Email Verification

```typescript
async function registerUser(data: RegisterUserDto) {
  return AppDataSource.transaction(async (manager) => {
    // Check if email exists
    const existing = await manager.findOneBy(User, { email: data.email });
    if (existing) throw new Error('Email already registered');

    // Create user
    const user = manager.create(User, {
      email: data.email,
      password: await hashPassword(data.password),
      isEmailVerified: false,
    });
    await manager.save(user);

    // Create verification token
    const token = manager.create(VerificationToken, {
      user,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    await manager.save(token);

    // Create default profile
    const profile = manager.create(Profile, {
      user,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    await manager.save(profile);

    return { user, verificationToken: token.token };
  });
}
```

---

### Lesson 11.9: Transaction Best Practices

#### 1. Keep Transactions Short

```typescript
// ❌ Bad: Long transaction
await AppDataSource.transaction(async (manager) => {
  await manager.save(entity1);
  await sendEmail(); // External call in transaction!
  await manager.save(entity2);
});

// ✅ Good: Short transaction, external calls outside
const result = await AppDataSource.transaction(async (manager) => {
  await manager.save(entity1);
  await manager.save(entity2);
  return { entity1, entity2 };
});
await sendEmail(); // After transaction
```

#### 2. Handle Deadlocks

```typescript
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isDeadlock = error.code === '40P01'; // PostgreSQL deadlock
      if (isDeadlock && attempt < maxRetries) {
        console.log(`Deadlock detected, retrying (${attempt}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, 100 * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### 3. Use Appropriate Isolation Level

```typescript
// For read-heavy operations
await AppDataSource.transaction('READ COMMITTED', async (manager) => {
  // Default, good for most cases
});

// For financial operations
await AppDataSource.transaction('SERIALIZABLE', async (manager) => {
  // Prevents phantom reads
});
```

---

## 🎯 Key Takeaways

1. **Transactions** ensure atomicity - all or nothing
2. Use **transaction()** for simple cases, **QueryRunner** for complex
3. Always **release** QueryRunner in finally block
4. Choose appropriate **isolation level** for your use case
5. Keep transactions **short** - no external calls inside
6. Handle **deadlocks** with retry logic

---

## ✅ Quiz

1. What does ACID stand for?
2. What happens if an error occurs in a transaction?
3. What's the difference between transaction() and QueryRunner?
4. What isolation level should you use for financial transactions?
5. Why should you keep transactions short?

<details>
<summary>View Answers</summary>

1. Atomicity, Consistency, Isolation, Durability
2. All changes are rolled back
3. transaction() is simpler; QueryRunner gives more control (savepoints, manual commit/rollback)
4. SERIALIZABLE for full isolation
5. To reduce lock contention and deadlock risk

</details>

---

## 📝 Homework

1. Implement a money transfer function with proper transaction handling
2. Create an order system that updates inventory atomically
3. Add retry logic for deadlock handling
4. Implement nested transactions with savepoints

---

## ➡️ Next Section

[Section 12: Performance Tuning](../section-12-performance/README.md)
