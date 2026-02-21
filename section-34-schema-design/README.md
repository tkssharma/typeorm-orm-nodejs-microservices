# Section 34: Schema Design & Data Modeling

## Topics Covered

### 1. Designing Schemas for Real Apps
- Understanding your data access patterns
- Read-heavy vs write-heavy considerations
- Denormalization strategies
- Schema evolution over time

### 2. Embedded vs Referenced Documents
- When to embed (one-to-few)
- When to reference (one-to-many, many-to-many)
- Hybrid approaches
- Document size limits (16MB)

### 3. One-to-One Relationships
- Embedding approach
- Reference approach
- Choosing based on access patterns

### 4. One-to-Many Relationships
- Embedding array of documents
- Array of references
- Parent reference pattern
- Bucket pattern for large arrays

### 5. Many-to-Many Relationships
- Two-way referencing
- Join collection pattern
- Denormalized approach

### 6. Handling Large Collections
- Pagination strategies
- Archiving old data
- Sharding considerations
- Collection design for scale

## Code Examples

### Embedded Documents
```javascript
const orderSchema = new mongoose.Schema({
  customer: {
    name: String,
    email: String,
    address: {
      street: String,
      city: String,
      zipCode: String
    }
  },
  items: [{
    product: String,
    quantity: Number,
    price: Number
  }],
  total: Number
});
```

### Referenced Documents
```javascript
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});
```

## Demo Project
```bash
cd section-34-schema-design/demo
cp .env.example .env
pnpm install
pnpm dev
```
