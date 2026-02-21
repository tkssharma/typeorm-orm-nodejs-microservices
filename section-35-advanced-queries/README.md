# Section 35: Advanced MongoDB Queries

## Topics Covered

### 1. Filtering & Projections
- Query operators ($eq, $ne, $gt, $gte, $lt, $lte)
- Logical operators ($and, $or, $not, $nor)
- Array operators ($in, $nin, $all, $elemMatch)
- Field selection with projections

### 2. Sorting & Pagination
- `.sort()` method
- Ascending vs descending order
- Multi-field sorting
- Skip/limit pagination
- Cursor-based pagination

### 3. Population & Joins ($lookup)
- Mongoose `.populate()` method
- Nested population
- Virtual population
- MongoDB $lookup aggregation

### 4. Aggregation Framework (Real Examples)
- Pipeline concept
- $match, $group, $project stages
- $sort, $limit, $skip stages
- Real-world aggregation examples

### 5. Text Search
- Text indexes
- $text operator
- Search scoring
- Language support

### 6. Geospatial Queries
- 2dsphere indexes
- $near and $geoWithin
- Location-based queries
- Distance calculations

## Code Examples

### Complex Query
```javascript
const results = await Product.find({
  price: { $gte: 10, $lte: 100 },
  category: { $in: ['electronics', 'gadgets'] },
  inStock: true
})
.select('name price category')
.sort({ price: 1 })
.limit(20);
```

### Aggregation Pipeline
```javascript
const stats = await Order.aggregate([
  { $match: { status: 'completed' } },
  { $group: {
    _id: '$customerId',
    totalSpent: { $sum: '$total' },
    orderCount: { $sum: 1 }
  }},
  { $sort: { totalSpent: -1 } },
  { $limit: 10 }
]);
```

## Demo Project
```bash
cd section-35-advanced-queries/demo
cp .env.example .env
pnpm install
pnpm dev
```
