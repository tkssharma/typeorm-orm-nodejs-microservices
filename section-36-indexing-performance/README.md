# Section 36: Indexing & Performance

## Topics Covered

### 1. How Indexes Work
- B-tree index structure
- Index overhead (write vs read tradeoff)
- Index selectivity
- Covered queries

### 2. Single Field & Compound Indexes
- Creating single field indexes
- Compound index order matters
- Index prefix usage
- ESR rule (Equality, Sort, Range)

### 3. Unique Indexes
- Enforcing uniqueness
- Sparse indexes
- Partial indexes
- Handling duplicates

### 4. Text Indexes
- Creating text indexes
- Multi-field text indexes
- Text search weights
- Language-specific stemming

### 5. Query Performance Analysis
- Using `.explain()`
- Reading query plans
- IXSCAN vs COLLSCAN
- Index usage statistics

### 6. When Indexes Hurt Performance
- Write performance impact
- Index size considerations
- Too many indexes
- Unused indexes

## Code Examples

### Creating Indexes
```javascript
// Single field index
userSchema.index({ email: 1 });

// Compound index
orderSchema.index({ customerId: 1, createdAt: -1 });

// Unique index
userSchema.index({ username: 1 }, { unique: true });

// Text index
productSchema.index({ name: 'text', description: 'text' });
```

### Query Analysis
```javascript
const explanation = await User.find({ email: 'test@example.com' })
  .explain('executionStats');

console.log(explanation.executionStats);
```

## Demo Project
```bash
cd section-36-indexing-performance/demo
cp .env.example .env
pnpm install
pnpm dev
```
