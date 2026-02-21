# Section 46: Common Mistakes & Interview Prep

## Topics Covered

### 1. MongoDB Design Mistakes
- Over-embedding (document too large)
- Under-embedding (too many lookups)
- Missing indexes on frequent queries
- Wrong shard key selection
- Ignoring document growth
- Not using projections

### 2. Performance Pitfalls
- N+1 query problems
- Unbounded array growth
- Missing compound indexes
- Not using covered queries
- Ignoring write concerns
- Connection pool exhaustion

### 3. Real MongoDB Interview Questions

#### Schema Design
- How would you design a schema for a social media feed?
- When would you embed vs reference documents?
- How do you handle many-to-many relationships?

#### Performance
- How do you optimize a slow MongoDB query?
- What is the difference between covered query and regular query?
- When would you use an index vs not?

#### Operations
- How do MongoDB transactions work?
- What is a replica set and why use it?
- How does sharding improve performance?

#### Practical
- Write an aggregation to get top 10 products by sales
- Design a schema for an e-commerce order system
- How would you implement soft deletes?

### 4. How Companies Use MongoDB
- Netflix: Content metadata
- Uber: Geospatial data
- eBay: Product catalog
- Forbes: Content management
- Startups: Full-stack applications

## Common Mistakes Checklist

### Schema Design
- [ ] Avoid unbounded arrays
- [ ] Use appropriate data types
- [ ] Plan for document growth
- [ ] Consider access patterns first

### Indexing
- [ ] Index fields used in queries
- [ ] Use compound indexes wisely
- [ ] Remove unused indexes
- [ ] Monitor index size

### Queries
- [ ] Use projections to limit fields
- [ ] Avoid regex without anchor
- [ ] Use explain() for slow queries
- [ ] Batch large operations

### Operations
- [ ] Use appropriate write concerns
- [ ] Handle connection errors
- [ ] Implement retry logic
- [ ] Monitor connection pool

## Interview Code Challenges

### Aggregation Challenge
```javascript
// Find average order value per customer, sorted by highest spender
const result = await Order.aggregate([
  { $group: {
    _id: '$customerId',
    avgOrderValue: { $avg: '$total' },
    totalSpent: { $sum: '$total' },
    orderCount: { $sum: 1 }
  }},
  { $sort: { totalSpent: -1 } },
  { $limit: 10 },
  { $lookup: {
    from: 'users',
    localField: '_id',
    foreignField: '_id',
    as: 'customer'
  }},
  { $unwind: '$customer' },
  { $project: {
    customerName: '$customer.name',
    avgOrderValue: { $round: ['$avgOrderValue', 2] },
    totalSpent: 1,
    orderCount: 1
  }}
]);
```

## Resources
- MongoDB University (free courses)
- MongoDB Documentation
- MongoDB Blog (best practices)
- Real-world case studies
