# Section 37: Validation & Data Integrity

## Topics Covered

### 1. Mongoose Validation vs MongoDB Validation
- Schema-level validation (Mongoose)
- Database-level validation (MongoDB)
- When to use which
- Validation order

### 2. Custom Validators
- Synchronous validators
- Async validators
- Validator error messages
- Conditional validation

### 3. Schema-Level vs Database-Level Rules
- JSON Schema validation in MongoDB
- Validation actions (error vs warn)
- Validation levels (strict vs moderate)

### 4. Handling Invalid Data Safely
- Validation error handling
- Error message formatting
- Client-friendly error responses
- Logging validation failures

## Code Examples

### Built-in Validators
```javascript
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    lowercase: true,
    trim: true
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age seems invalid']
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'moderator'],
      message: '{VALUE} is not a valid role'
    }
  }
});
```

### Custom Validator
```javascript
const productSchema = new mongoose.Schema({
  price: {
    type: Number,
    validate: {
      validator: function(value) {
        return value > 0;
      },
      message: 'Price must be positive'
    }
  },
  sku: {
    type: String,
    validate: {
      validator: async function(value) {
        const count = await this.constructor.countDocuments({ sku: value });
        return count === 0;
      },
      message: 'SKU must be unique'
    }
  }
});
```

## Demo Project
```bash
cd section-37-validation/demo
cp .env.example .env
pnpm install
pnpm dev
```
