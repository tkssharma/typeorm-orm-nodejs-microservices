import express, { Request, Response, NextFunction } from 'express';
import prisma from './lib/prisma';
import usersRouter from './routes/users';
import postsRouter from './routes/posts';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/users', usersRouter);
app.use('/posts', postsRouter);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Prisma + Express.js API',
    endpoints: {
      users: '/users',
      posts: '/posts',
      health: '/health',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Prisma + Express.js Server

Server running at: http://localhost:${PORT}

Available endpoints:
  GET    /              - API info
  GET    /health        - Health check
  
  GET    /users         - List all users
  GET    /users/:id     - Get user by ID
  POST   /users         - Create user
  PUT    /users/:id     - Update user
  DELETE /users/:id     - Delete user
  
  GET    /posts         - List all posts
  GET    /posts/:id     - Get post by ID
  POST   /posts         - Create post
  PUT    /posts/:id     - Update post
  PATCH  /posts/:id/publish - Publish post
  DELETE /posts/:id     - Delete post
  `);
});

export default app;
