import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'blog_app',

  // IMPORTANT: Always false in production - use migrations instead
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',

  // Entity and migration paths
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],

  // Connection pool settings
  extra: {
    max: 10, // Maximum number of connections
    idleTimeoutMillis: 30000,
  },
});
