# Section 51: Nova ODM Essentials

## What is Nova ODM?
Nova ODM is a TypeScript-first Object Document Mapper for DynamoDB that provides:
- Schema validation and type safety
- Simplified CRUD operations
- Query builders
- Hooks and middleware

---

## Topics Covered

### 1. What is Nova ODM and Why Use It

| Without ODM (Raw SDK) | With Nova ODM |
|-----------------------|---------------|
| Manual marshalling | Automatic |
| No schema validation | Built-in validation |
| Verbose code | Concise API |
| No TypeScript types | Full type safety |

### 2. Defining Models & Schemas

```typescript
import { Model, Schema, attribute, hashKey, sortKey } from 'nova-odm';

// Define the User schema
@Model()
class User {
  @hashKey()
  PK: string;  // USER#<id>

  @sortKey()
  SK: string;  // PROFILE or ORDER#<date>

  @attribute()
  name: string;

  @attribute()
  email: string;

  @attribute({ default: () => new Date().toISOString() })
  createdAt: string;

  @attribute({ default: true })
  isActive: boolean;
}

// Or using schema definition
const userSchema = new Schema({
  PK: { type: 'string', hashKey: true },
  SK: { type: 'string', sortKey: true },
  name: { type: 'string', required: true },
  email: { type: 'string', required: true },
  createdAt: { type: 'string', default: () => new Date().toISOString() },
  isActive: { type: 'boolean', default: true }
});
```

### 3. Attribute Types & Defaults

```typescript
import { Schema } from 'nova-odm';

const productSchema = new Schema({
  // String type
  productId: { type: 'string', required: true },
  
  // Number type
  price: { type: 'number', required: true },
  
  // Boolean type
  inStock: { type: 'boolean', default: true },
  
  // List (array) type
  tags: { type: 'list', items: 'string' },
  
  // Map (object) type
  metadata: {
    type: 'map',
    properties: {
      color: { type: 'string' },
      size: { type: 'string' }
    }
  },
  
  // Set types
  categories: { type: 'stringSet' },
  quantities: { type: 'numberSet' },
  
  // Default with function
  createdAt: { type: 'string', default: () => new Date().toISOString() },
  
  // Computed attribute
  SKU: {
    type: 'string',
    default: function() {
      return `PROD-${this.productId}`;
    }
  }
});
```

### 4. CRUD Operations with Nova

```typescript
import { DataMapper } from 'nova-odm';

const mapper = new DataMapper({ client: dynamoDBClient });

// CREATE
const user = new User();
user.PK = 'USER#123';
user.SK = 'PROFILE';
user.name = 'John Doe';
user.email = 'john@example.com';

await mapper.put(user);

// READ
const fetchedUser = await mapper.get(User, {
  PK: 'USER#123',
  SK: 'PROFILE'
});
console.log(fetchedUser.name); // 'John Doe'

// UPDATE
fetchedUser.name = 'John Smith';
await mapper.update(fetchedUser);

// DELETE
await mapper.delete(User, {
  PK: 'USER#123',
  SK: 'PROFILE'
});
```

### 5. Querying Data with Nova

```typescript
// Query by partition key
const orders = await mapper.query(Order, {
  keyCondition: {
    PK: 'USER#123',
    SK: beginsWith('ORDER#')
  }
});

for await (const order of orders) {
  console.log(order.total);
}

// Query with filter
const recentOrders = await mapper.query(Order, {
  keyCondition: {
    PK: 'USER#123',
    SK: between('ORDER#2024-01-01', 'ORDER#2024-12-31')
  },
  filter: {
    total: greaterThan(100)
  },
  scanIndexForward: false,  // Descending
  limit: 10
});

// Query using GSI
const ordersByStatus = await mapper.query(Order, {
  indexName: 'GSI1',
  keyCondition: {
    GSI1PK: 'STATUS#pending',
    GSI1SK: beginsWith('ORDER#')
  }
});
```

### 6. Model-Level Validation

```typescript
import { Schema, validate } from 'nova-odm';

const userSchema = new Schema({
  PK: { type: 'string', required: true },
  SK: { type: 'string', required: true },
  email: {
    type: 'string',
    required: true,
    validate: (value) => {
      if (!value.includes('@')) {
        throw new Error('Invalid email format');
      }
    }
  },
  age: {
    type: 'number',
    validate: (value) => {
      if (value < 0 || value > 150) {
        throw new Error('Age must be between 0 and 150');
      }
    }
  },
  role: {
    type: 'string',
    enum: ['admin', 'user', 'guest']
  }
});

// Validation runs automatically on save
try {
  user.email = 'invalid-email';
  await mapper.put(user);  // Throws validation error
} catch (error) {
  console.log(error.message); // 'Invalid email format'
}
```

---

## Complete Example: User Service

```typescript
import { Model, Schema, DataMapper, hashKey, sortKey, attribute } from 'nova-odm';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Initialize client
const client = new DynamoDBClient({
  region: 'local',
  endpoint: 'http://localhost:8000'
});

const mapper = new DataMapper({
  client,
  tableNamePrefix: 'dev_'
});

// Define User model
@Model({ tableName: 'Application' })
class User {
  @hashKey()
  PK: string;

  @sortKey()
  SK: string;

  @attribute()
  name: string;

  @attribute()
  email: string;

  @attribute({ default: () => new Date().toISOString() })
  createdAt: string;
}

// User Service
class UserService {
  async createUser(userId: string, name: string, email: string) {
    const user = new User();
    user.PK = `USER#${userId}`;
    user.SK = 'PROFILE';
    user.name = name;
    user.email = email;
    
    await mapper.put(user);
    return user;
  }

  async getUser(userId: string) {
    return mapper.get(User, {
      PK: `USER#${userId}`,
      SK: 'PROFILE'
    });
  }

  async updateUser(userId: string, updates: Partial<User>) {
    const user = await this.getUser(userId);
    Object.assign(user, updates);
    await mapper.update(user);
    return user;
  }

  async deleteUser(userId: string) {
    await mapper.delete(User, {
      PK: `USER#${userId}`,
      SK: 'PROFILE'
    });
  }
}
```

---

## Hands-On Demo

```bash
cd section-51-nova-odm/demo
cp .env.example .env
pnpm install
pnpm dev
```
