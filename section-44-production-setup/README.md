# Section 44: Production Setup

## Topics Covered

### 1. Environment-Based Configs
- Development vs production settings
- Configuration management
- Feature flags
- Environment validation

### 2. MongoDB Atlas in Production
- Production cluster setup
- Network security (VPC peering, private endpoints)
- Backup schedules
- Alerts and monitoring

### 3. Backup & Restore
- Automated backups in Atlas
- Point-in-time recovery
- mongodump and mongorestore
- Backup testing strategies

### 4. Monitoring Queries & Performance
- MongoDB Atlas monitoring
- Slow query log analysis
- Performance Advisor
- Real-time metrics

## Code Examples

### Environment Configuration
```javascript
const config = {
  development: {
    mongodb: {
      uri: process.env.MONGODB_URI_DEV,
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000
      }
    },
    logging: true
  },
  production: {
    mongodb: {
      uri: process.env.MONGODB_URI_PROD,
      options: {
        maxPoolSize: 50,
        serverSelectionTimeoutMS: 10000,
        ssl: true,
        retryWrites: true,
        w: 'majority'
      }
    },
    logging: false
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

### Health Check Endpoint
```javascript
app.get('/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbPing = await mongoose.connection.db.admin().ping();
    
    res.json({
      status: 'healthy',
      database: {
        connected: dbState === 1,
        ping: dbPing.ok === 1
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Graceful Shutdown
```javascript
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Closing MongoDB connection...`);
  
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

## Demo Project
```bash
cd section-44-production-setup/demo
cp .env.example .env
pnpm install
pnpm dev
```
