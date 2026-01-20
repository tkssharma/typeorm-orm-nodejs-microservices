import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { User } from "./entities/User";

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected!");

    const userRepository = AppDataSource.getRepository(User);

    // CREATE - Add a new user
    console.log("\n📝 Creating a new user...");
    const newUser = userRepository.create({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
    });
    const savedUser = await userRepository.save(newUser);
    console.log("✅ User created:", savedUser);

    // READ - Find all users
    console.log("\n📖 Finding all users...");
    const allUsers = await userRepository.find();
    console.log("Users found:", allUsers.length);

    // READ - Find one user
    console.log("\n🔍 Finding user by ID...");
    const foundUser = await userRepository.findOneBy({ id: savedUser.id });
    console.log("Found user:", foundUser?.email);

    // UPDATE - Update user
    console.log("\n✏️ Updating user...");
    foundUser!.firstName = "Jane";
    const updatedUser = await userRepository.save(foundUser!);
    console.log("Updated user:", updatedUser.firstName);

    // DELETE - Remove user
    console.log("\n🗑️ Deleting user...");
    await userRepository.delete(savedUser.id);
    console.log("✅ User deleted");

    // Verify deletion
    const deletedUser = await userRepository.findOneBy({ id: savedUser.id });
    console.log("User exists after delete:", deletedUser !== null);

    console.log("\n🎉 Basic CRUD operations completed!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log("👋 Connection closed");
  }
}

main();
