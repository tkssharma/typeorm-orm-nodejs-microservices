import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { User, UserRole, UserStatus } from "./entities/User";
import { Product, ProductCategory } from "./entities/Product";
import { Company, Address } from "./entities/Company";

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected!");

    const userRepo = AppDataSource.getRepository(User);
    const productRepo = AppDataSource.getRepository(Product);
    const companyRepo = AppDataSource.getRepository(Company);

    // Create a user
    const user = userRepo.create({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "hashedpassword123",
      age: 30,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      preferences: { theme: "dark", notifications: true },
    });
    await userRepo.save(user);
    console.log("✅ User created:", user.id);

    // Create a product
    const product = productRepo.create({
      name: "TypeScript Handbook",
      description: "Complete guide to TypeScript",
      price: "29.99",
      quantity: 100,
      category: ProductCategory.BOOKS,
      tags: ["typescript", "programming", "guide"],
    });
    await productRepo.save(product);
    console.log("✅ Product created:", product.id);

    // Create a company with embedded addresses
    const headquarters: Address = {
      street: "123 Tech Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      country: "USA",
    };

    const billingAddress: Address = {
      street: "456 Finance Ave",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
    };

    const company = companyRepo.create({
      name: "Tech Corp",
      industry: "Technology",
      employeeCount: 500,
      headquarters,
      billingAddress,
    });
    await companyRepo.save(company);
    console.log("✅ Company created:", company.id);

    // Query examples
    const allUsers = await userRepo.find();
    console.log("📊 Total users:", allUsers.length);

    const activeProducts = await productRepo.find({
      where: { isAvailable: true },
    });
    console.log("📊 Available products:", activeProducts.length);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await AppDataSource.destroy();
    console.log("👋 Connection closed");
  }
}

main();
