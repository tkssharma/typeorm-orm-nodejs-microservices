# Section 40: MongoDB Aggregation Mastery

## Topics Covered

### 1. Aggregation Pipeline Deep Dive
- Pipeline stages concept
- Stage order optimization
- Memory limits and allowDiskUse
- Pipeline vs find queries

### 2. $match, $group, $project
- Filtering with $match
- Grouping and accumulators
- Field transformation with $project
- Computed fields

### 3. $lookup with Real Data
- Left outer join equivalent
- Local and foreign fields
- Pipeline in $lookup
- Multiple lookups

### 4. $unwind & $facet
- Deconstructing arrays
- preserveNullAndEmptyArrays
- Multiple facets in one query
- Parallel pipelines

### 5. Analytics Queries
- Time-series aggregations
- Moving averages
- Percentile calculations
- Trend analysis

### 6. Reporting APIs
- Dashboard data queries
- Summary statistics
- Top N queries
- Date-based grouping

## Code Examples

### Sales Analytics
```javascript
const salesReport = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }
  },
  {
    $group: {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      },
      totalSales: { $sum: '$total' },
      orderCount: { $sum: 1 },
      avgOrderValue: { $avg: '$total' }
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } }
]);
```

### Product Stats with Lookup
```javascript
const productStats = await Product.aggregate([
  {
    $lookup: {
      from: 'orders',
      localField: '_id',
      foreignField: 'items.productId',
      as: 'orders'
    }
  },
  {
    $project: {
      name: 1,
      price: 1,
      totalOrders: { $size: '$orders' },
      revenue: {
        $reduce: {
          input: '$orders',
          initialValue: 0,
          in: { $add: ['$$value', '$$this.total'] }
        }
      }
    }
  },
  { $sort: { revenue: -1 } },
  { $limit: 10 }
]);
```

### Multi-Facet Dashboard
```javascript
const dashboard = await Order.aggregate([
  {
    $facet: {
      recentOrders: [
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        { $project: { _id: 1, total: 1, status: 1, createdAt: 1 } }
      ],
      statusCounts: [
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ],
      dailyRevenue: [
        { $match: { createdAt: { $gte: last7Days } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' }
        }},
        { $sort: { _id: 1 } }
      ]
    }
  }
]);
```

## Demo Project
```bash
cd section-40-aggregation-mastery/demo
cp .env.example .env
pnpm install
pnpm dev
```
