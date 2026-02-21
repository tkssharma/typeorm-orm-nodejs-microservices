# Section 32: Connecting MongoDB with Node.js

## Topics Covered

### 1. MongoDB Node.js Driver
- Installing mongodb package
- MongoClient connection
- Database and collection access
- Closing connections properly

### 2. Connection Strings & Environment Variables
- MongoDB URI format
- Local vs Atlas connection strings
- Using dotenv for secrets
- Connection string options

### 3. Handling Connection Errors
- Connection error types
- Retry logic implementation
- Graceful error handling
- Connection timeout settings

### 4. Project Structure for MongoDB APIs
- Organizing database code
- Singleton pattern for connections
- Repository pattern basics
- Separating concerns

## Code Examples

### Basic Connection
```javascript
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connect() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db('myapp');
  } catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
  }
}
```

### Environment Variables
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
```

## Demo Project
```bash
cd section-32-mongodb-nodejs-connection/demo
cp .env.example .env
pnpm install
pnpm dev
```
