import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { createApp } from "./app";

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log("✅ Database connection established");

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API endpoints:`);
      console.log(`   GET    /api/users          - List users`);
      console.log(`   GET    /api/users/:id      - Get user by ID`);
      console.log(`   POST   /api/users          - Create user`);
      console.log(`   PUT    /api/users/:id      - Update user`);
      console.log(`   DELETE /api/users/:id      - Delete user`);
      console.log(`   POST   /api/users/:id/restore - Restore user`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

main();