# Section 42: Security Best Practices (MongoDB Focused)

## Topics Covered

### 1. Preventing NoSQL Injection
- Query operator injection
- Using mongo-sanitize
- Input validation
- Parameterized queries

### 2. Secure Connection Strings
- Never hardcode credentials
- Environment variable management
- Secrets managers
- Connection string rotation

### 3. Role-Based Database Access
- MongoDB built-in roles
- Custom roles
- Principle of least privilege
- Application-specific users

### 4. Data Encryption at Rest & Transit
- MongoDB Atlas encryption
- TLS/SSL connections
- Field-level encryption
- Client-side encryption

## Code Examples

### NoSQL Injection Prevention
```javascript
import mongoSanitize from 'express-mongo-sanitize';

// Middleware to sanitize input
app.use(mongoSanitize());

// Manual sanitization
const sanitizeInput = (input) => {
  if (typeof input === 'object') {
    for (const key in input) {
      if (key.startsWith('$')) {
        delete input[key];
      }
    }
  }
  return input;
};

// Safe query building
const findUser = async (email) => {
  // Always validate and sanitize
  if (typeof email !== 'string') {
    throw new Error('Invalid email format');
  }
  return User.findOne({ email: email.toLowerCase().trim() });
};
```

### Secure Connection
```javascript
const mongoose = require('mongoose');

const options = {
  ssl: true,
  sslValidate: true,
  authSource: 'admin',
  retryWrites: true,
  w: 'majority'
};

mongoose.connect(process.env.MONGODB_URI, options);
```

### Field-Level Encryption
```javascript
import { ClientEncryption } from 'mongodb-client-encryption';

// Encrypt sensitive fields
const encryptedUser = {
  email: user.email,
  ssn: await clientEncryption.encrypt(user.ssn, {
    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
    keyId: dataKeyId
  })
};
```

## Demo Project
```bash
cd section-42-security/demo
cp .env.example .env
pnpm install
pnpm dev
```
