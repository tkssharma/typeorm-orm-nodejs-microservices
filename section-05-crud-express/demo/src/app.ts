import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { userRoutes } from "./routes/userRoutes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use("/api/users", userRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
