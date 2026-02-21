# Section 43: Scaling MongoDB Applications

## Topics Covered

### 1. Connection Pooling
- Default pool size
- Configuring pool options
- Connection reuse
- Pool monitoring

### 2. MongoDB Atlas Scaling
- Cluster tier scaling
- Auto-scaling configuration
- Read replicas
- Regional distribution

### 3. Replica Sets Explained
- Primary and secondary nodes
- Read preferences
- Write concerns
- Automatic failover

### 4. Sharding Basics
- When to shard
- Shard key selection
- Chunks and balancing
- Sharded cluster architecture

### 5. Handling High-Traffic APIs
- Caching strategies
- Read/write splitting
- Connection management
- Rate limiting at database level

## Code Examples

### Connection Pool Configuration
```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000
});

// Monitor pool events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected with pool');
});
```

### Read Preference
```javascript
// Read from secondaries for analytics
const analytics = await Order.aggregate([...])
  .read('secondary');

// Read from nearest for low latency
const user = await User.findById(id)
  .read('nearest');

// Always read from primary for critical data
const balance = await Account.findById(id)
  .read('primary');
```

### Write Concern
```javascript
// Ensure write is acknowledged by majority
await Order.create([order], {
  writeConcern: { w: 'majority', j: true }
});

// Fast writes (less durable)
await Log.create([log], {
  writeConcern: { w: 1, j: false }
});
```

## Demo Project
```bash
cd section-43-scaling/demo
cp .env.example .env
pnpm install
pnpm dev
```
