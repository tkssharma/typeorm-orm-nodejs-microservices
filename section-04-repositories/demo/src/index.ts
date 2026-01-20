import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { UserRepository } from "./repositories/UserRepository";

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected!");

    // Clean up first
    await UserRepository.clear();

    // CREATE - Using custom repository
    console.log("\n📝 Creating users...");
    const users = [
      { firstName: "John", lastName: "Doe", email: "john@example.com" },
      { firstName: "Jane", lastName: "Smith", email: "jane@example.com" },
      { firstName: "Bob", lastName: "Johnson", email: "bob@example.com" },
      { firstName: "Alice", lastName: "Williams", email: "alice@example.com" },
      { firstName: "Charlie", lastName: "Brown", email: "charlie@example.com" },
    ];

    for (const userData of users) {
      const user = UserRepository.create(userData);
      await UserRepository.save(user);
    }
    console.log(`✅ Created ${users.length} users`);

    // READ - Using custom findByEmail method
    console.log("\n🔍 Finding user by email...");
    const john = await UserRepository.findByEmail("john@example.com");
    console.log("Found:", john?.firstName, john?.lastName);

    // READ - Using custom findActiveUsers method
    console.log("\n📋 Finding all active users...");
    const activeUsers = await UserRepository.findActiveUsers();
    console.log("Active users:", activeUsers.length);

    // READ - Using custom pagination method
    console.log("\n📄 Finding users with pagination...");
    const paginatedResult = await UserRepository.findWithPagination(1, 2);
    console.log("Page 1 (2 per page):", paginatedResult.data.map(u => u.firstName));
    console.log("Total pages:", paginatedResult.meta.totalPages);

    // READ - Using custom search method
    console.log("\n🔎 Searching users by name 'John'...");
    const searchResults = await UserRepository.searchByName("John");
    console.log("Search results:", searchResults.map(u => `${u.firstName} ${u.lastName}`));

    // UPDATE - Using custom toggleActive method
    console.log("\n🔄 Toggling user active status...");
    const toggledUser = await UserRepository.toggleActive(john!.id);
    console.log(`${toggledUser.firstName} isActive:`, toggledUser.isActive);

    // Standard repository methods still work
    console.log("\n📊 Using standard repository methods...");
    const count = await UserRepository.count();
    console.log("Total users:", count);

    const exists = await UserRepository.existsBy({ email: "jane@example.com" });
    console.log("Jane exists:", exists);

    console.log("\n🎉 Custom repository demo completed!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log("👋 Connection closed");
  }
}

main();
