# Section 33: Mongoose Essentials

## Topics Covered

### 1. Why Mongoose
- ODM (Object Document Mapper) benefits
- Schema enforcement in schemaless MongoDB
- Built-in validation and middleware
- Query helpers and virtuals

### 2. Defining Schemas & Models
- Schema definition syntax
- Creating models from schemas
- Model naming conventions
- Schema options

### 3. Data Types & Validation
- String, Number, Date, Boolean, ObjectId
- Array and nested object types
- Required, min, max, enum validators
- Custom validation functions

### 4. Default Values & Timestamps
- Setting default values
- `timestamps: true` option
- createdAt and updatedAt fields
- Custom timestamp field names

### 5. CRUD Operations using Mongoose
- `Model.create()` and `new Model().save()`
- `Model.find()`, `findById()`, `findOne()`
- `Model.updateOne()`, `findByIdAndUpdate()`
- `Model.deleteOne()`, `findByIdAndDelete()`

### 6. Query Helpers
- Chaining query methods
- `.select()`, `.sort()`, `.limit()`, `.skip()`
- `.lean()` for plain objects
- `.exec()` for promises

## Code Examples

### Schema Definition
```javascript
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, min: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
```

## Demo Project
```bash
cd section-33-mongoose-essentials/demo
cp .env.example .env
pnpm install
pnpm dev
```
