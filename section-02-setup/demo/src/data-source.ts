import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "./entities/User";
import { Author } from "./entities/Author";
import { Book } from "./entities/Book";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "typeorm_course",
  synchronize: true, // Auto-create tables in development
  logging: true,
  entities: [User, Author, Book],
  migrations: ["src/migrations/**/*.ts"],
});
