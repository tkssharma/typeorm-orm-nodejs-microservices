# Section 16: Deployment with Docker

## 📚 Learning Objectives

By the end of this section, you will:

- Dockerize your TypeORM application
- Set up Docker Compose for development
- Configure environment variables for production
- Run migrations in Docker
- Deploy to production

---

## 📖 Lessons

### Lesson 16.1: Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy migrations (needed at runtime)
COPY --from=builder /app/src/migrations ./src/migrations

# Set environment
ENV NODE_ENV=production

EXPOSE 3000

# Run migrations and start
CMD ["sh", "-c", "npm run migration:run:prod && node dist/index.js"]
```

### Lesson 16.2: Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - '3000:3000'
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgres
      - DB_DATABASE=typeorm_dev
    depends_on:
      postgres:
        condition: service_healthy
    command: npm run dev

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: typeorm_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

  adminer:
    image: adminer
    ports:
      - '8080:8080'
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### Lesson 16.3: Development Dockerfile

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Lesson 16.4: Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_DATABASE=${DB_DATABASE}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_DATABASE}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USERNAME}']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### Lesson 16.5: Production Data Source

```typescript
// src/data-source.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const baseOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'typeorm_dev',
  synchronize: false, // Always false!
  logging: !isProduction,
};

const developmentOptions: DataSourceOptions = {
  ...baseOptions,
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
};

const productionOptions: DataSourceOptions = {
  ...baseOptions,
  entities: ['dist/entities/**/*.js'],
  migrations: ['dist/migrations/**/*.js'],
  subscribers: ['dist/subscribers/**/*.js'],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  extra: {
    max: parseInt(process.env.DB_POOL_SIZE || '20'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
};

export const AppDataSource = new DataSource(isProduction ? productionOptions : developmentOptions);
```

### Lesson 16.6: Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn src/index.ts",

    "typeorm": "typeorm-ts-node-commonjs",
    "typeorm:prod": "typeorm",

    "migration:generate": "npm run typeorm -- migration:generate -d src/data-source.ts",
    "migration:create": "npm run typeorm -- migration:create",
    "migration:run": "npm run typeorm -- migration:run -d src/data-source.ts",
    "migration:run:prod": "npm run typeorm:prod -- migration:run -d dist/data-source.js",
    "migration:revert": "npm run typeorm -- migration:revert -d src/data-source.ts",

    "docker:dev": "docker-compose up --build",
    "docker:prod": "docker-compose -f docker-compose.prod.yml up --build -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f app"
  }
}
```

### Lesson 16.7: Environment Variables

```bash
# .env.example
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DB_DATABASE=your_database
DB_SSL=false
DB_POOL_SIZE=20

# Application
NODE_ENV=production
PORT=3000

# Authentication
JWT_SECRET=your_very_long_and_secure_secret_key
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
```

### Lesson 16.8: Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /health {
            proxy_pass http://app/health;
            proxy_http_version 1.1;
        }
    }
}
```

### Lesson 16.9: Health Check Endpoint

```typescript
// src/routes/health.ts
import { Router } from 'express';
import { AppDataSource } from '../data-source';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await AppDataSource.query('SELECT 1');

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/ready', async (req, res) => {
  if (AppDataSource.isInitialized) {
    res.json({ ready: true });
  } else {
    res.status(503).json({ ready: false });
  }
});

export { router as healthRoutes };
```

### Lesson 16.10: Deployment Checklist

#### Pre-Deployment

- [ ] All tests passing
- [ ] Migrations generated and tested
- [ ] Environment variables documented
- [ ] `synchronize: false` in production
- [ ] Logging configured
- [ ] Error handling in place
- [ ] Health check endpoint working

#### Security

- [ ] Strong JWT secret
- [ ] Database password secure
- [ ] SSL/TLS configured
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Helmet middleware active
- [ ] Input validation on all endpoints

#### Performance

- [ ] Connection pooling configured
- [ ] Indexes on frequently queried columns
- [ ] Query caching where appropriate
- [ ] Pagination on list endpoints

#### Monitoring

- [ ] Health check endpoint
- [ ] Logging to external service
- [ ] Error tracking (Sentry, etc.)
- [ ] Database monitoring

---

## 🚀 Deployment Commands

```bash
# Build and start production
docker-compose -f docker-compose.prod.yml up --build -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Run migrations manually
docker-compose -f docker-compose.prod.yml exec app npm run migration:run:prod

# Scale application
docker-compose -f docker-compose.prod.yml up --scale app=3 -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Remove volumes (CAUTION: deletes data)
docker-compose -f docker-compose.prod.yml down -v
```

---

## 🎯 Key Takeaways

1. Use **multi-stage builds** for smaller images
2. **Never use synchronize** in production
3. Run **migrations** as part of deployment
4. Configure **connection pooling** for production
5. Use **health checks** for container orchestration
6. Store secrets in **environment variables**

---

## ✅ Quiz

1. Why use multi-stage Docker builds?
2. How do you run migrations in a Docker container?
3. What should `synchronize` be set to in production?
4. Why is a health check endpoint important?
5. How do you pass secrets to Docker containers?

<details>
<summary>View Answers</summary>

1. To reduce final image size by excluding build dependencies
2. Run as part of CMD or as a separate init container
3. `false` - always use migrations in production
4. For container orchestration, load balancers, and monitoring
5. Through environment variables, not hardcoded in images

</details>

---

## 📝 Homework

1. Dockerize your capstone project
2. Set up Docker Compose for development
3. Create a production Docker Compose with Nginx
4. Implement health check endpoints
5. Deploy to a cloud provider (AWS, GCP, DigitalOcean)

---

## ➡️ Next Section

[Bonus Section: Comparisons and Advanced Patterns](../bonus-section/README.md)
