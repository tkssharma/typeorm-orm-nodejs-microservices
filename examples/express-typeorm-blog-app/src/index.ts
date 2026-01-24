import 'reflect-metadata';
import express from 'express';
import * as dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log('Database connection established');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API endpoints:`);
      console.log(`  - GET    /api/authors`);
      console.log(`  - GET    /api/authors/:id`);
      console.log(`  - POST   /api/authors`);
      console.log(`  - PUT    /api/authors/:id`);
      console.log(`  - DELETE /api/authors/:id`);
      console.log(`  - GET    /api/posts`);
      console.log(`  - GET    /api/posts/published`);
      console.log(`  - GET    /api/posts/:id`);
      console.log(`  - POST   /api/posts`);
      console.log(`  - PATCH  /api/posts/:id/publish`);
      console.log(`  - DELETE /api/posts/:id`);
      console.log(`  - GET    /api/comments/post/:postId`);
      console.log(`  - POST   /api/comments`);
      console.log(`  - POST   /api/comments/:id/reply`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to database:', error);
    process.exit(1);
  });
