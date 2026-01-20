import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { User } from "./entities/User";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// GET all users
app.get("/users", async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET user by ID
app.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: parseInt(req.params.id) });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// POST create user
app.post("/users", async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const { firstName, lastName, email } = req.body;

    const user = userRepository.create({ firstName, lastName, email });
    const savedUser = await userRepository.save(user);
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PUT update user
app.put("/users/:id", async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: parseInt(req.params.id) });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    Object.assign(user, req.body);
    const updatedUser = await userRepository.save(user);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE user
app.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: parseInt(req.params.id) });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await userRepository.remove(user);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Start server
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connected!");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`\nAPI Endpoints:`);
      console.log(`  GET    /health`);
      console.log(`  GET    /users`);
      console.log(`  GET    /users/:id`);
      console.log(`  POST   /users`);
      console.log(`  PUT    /users/:id`);
      console.log(`  DELETE /users/:id`);
    });
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("\n👋 Shutting down...");
  await AppDataSource.destroy();
  process.exit(0);
});
