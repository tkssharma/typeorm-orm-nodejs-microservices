import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities/User";

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("🌱 Starting database seeding...\n");

    const userRepository = AppDataSource.getRepository(User);

    // Check if users already exist
    const existingCount = await userRepository.count();
    if (existingCount > 0) {
      console.log(`⏭️ Database already has ${existingCount} users, skipping seed`);
      await AppDataSource.destroy();
      return;
    }

    // Seed users
    const users = [
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        role: UserRole.USER,
        isActive: true,
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        role: UserRole.USER,
        isActive: true,
      },
      {
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob.johnson@example.com",
        role: UserRole.MODERATOR,
        isActive: true,
      },
      {
        firstName: "Alice",
        lastName: "Williams",
        email: "alice.williams@example.com",
        role: UserRole.USER,
        isActive: false,
      },
    ];

    for (const userData of users) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(`✅ Created user: ${userData.email}`);
    }

    console.log(`\n✅ Seeding completed! Created ${users.length} users`);
    await AppDataSource.destroy();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
