import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import { Brackets } from "typeorm";

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected!");

    const userRepo = AppDataSource.getRepository(User);
    const postRepo = AppDataSource.getRepository(Post);

    // Clean and seed data
    await postRepo.createQueryBuilder().delete().from(Post).execute();
    await userRepo.createQueryBuilder().delete().from(User).execute();

    // Create test users
    const users = await userRepo.save([
      { firstName: "John", lastName: "Doe", email: "john@example.com", age: 30 },
      { firstName: "Jane", lastName: "Smith", email: "jane@example.com", age: 25 },
      { firstName: "Bob", lastName: "Johnson", email: "bob@example.com", age: 35, isActive: false },
    ]);

    // Create test posts
    await postRepo.save([
      { title: "TypeORM Basics", content: "Learn TypeORM...", views: 100, isPublished: true, author: users[0] },
      { title: "Advanced Queries", content: "QueryBuilder...", views: 50, isPublished: true, author: users[0] },
      { title: "Draft Post", content: "Work in progress", views: 0, isPublished: false, author: users[1] },
    ]);

    // ========================================
    // BASIC SELECT
    // ========================================
    console.log("\n📋 Basic SELECT:");
    const allUsers = await userRepo
      .createQueryBuilder("user")
      .select(["user.id", "user.firstName", "user.email"])
      .getMany();
    console.log("Users:", allUsers.map(u => u.firstName));

    // ========================================
    // WHERE CONDITIONS
    // ========================================
    console.log("\n🔍 WHERE conditions:");

    // Simple where
    const activeUsers = await userRepo
      .createQueryBuilder("user")
      .where("user.isActive = :active", { active: true })
      .orderBy("user.createdAt", "DESC")
      .getMany();
    console.log("Active users:", activeUsers.length);

    // AND conditions
    const filteredUsers = await userRepo
      .createQueryBuilder("user")
      .where("user.isActive = :active", { active: true })
      .andWhere("user.age >= :minAge", { minAge: 25 })
      .getMany();
    console.log("Active users age >= 25:", filteredUsers.length);

    // Complex conditions with Brackets
    const complexQuery = await userRepo
      .createQueryBuilder("user")
      .where("user.isActive = :active", { active: true })
      .andWhere(
        new Brackets((qb) => {
          qb.where("user.age < :young", { young: 30 })
            .orWhere("user.firstName ILIKE :name", { name: "%john%" });
        })
      )
      .getMany();
    console.log("Complex query results:", complexQuery.map(u => u.firstName));

    // ========================================
    // JOINS
    // ========================================
    console.log("\n🔗 JOIN queries:");

    const usersWithPosts = await userRepo
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.posts", "post")
      .where("post.isPublished = :published", { published: true })
      .getMany();
    console.log("Users with published posts:", usersWithPosts.map(u => `${u.firstName} (${u.posts.length} posts)`));

    // ========================================
    // AGGREGATIONS
    // ========================================
    console.log("\n📊 Aggregations:");

    const stats = await postRepo
      .createQueryBuilder("post")
      .select("SUM(post.views)", "totalViews")
      .addSelect("AVG(post.views)", "avgViews")
      .addSelect("COUNT(*)", "totalPosts")
      .getRawOne();
    console.log("Post stats:", stats);

    // Group by author
    const postsByAuthor = await postRepo
      .createQueryBuilder("post")
      .select("post.authorId", "authorId")
      .addSelect("COUNT(*)", "postCount")
      .addSelect("SUM(post.views)", "totalViews")
      .groupBy("post.authorId")
      .getRawMany();
    console.log("Posts by author:", postsByAuthor);

    // ========================================
    // PAGINATION
    // ========================================
    console.log("\n📄 Pagination:");

    const [paginatedUsers, total] = await userRepo
      .createQueryBuilder("user")
      .orderBy("user.createdAt", "DESC")
      .skip(0)
      .take(2)
      .getManyAndCount();
    console.log(`Page 1: ${paginatedUsers.length} of ${total} users`);

    // ========================================
    // UPDATE with QueryBuilder
    // ========================================
    console.log("\n✏️ UPDATE:");

    await userRepo
      .createQueryBuilder()
      .update(User)
      .set({ isActive: true })
      .where("isActive = :active", { active: false })
      .execute();
    console.log("Reactivated inactive users");

    // ========================================
    // Subquery example
    // ========================================
    console.log("\n🔄 Subquery:");

    const usersWithPublishedPosts = await userRepo
      .createQueryBuilder("user")
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select("post.authorId")
          .from(Post, "post")
          .where("post.isPublished = :published", { published: true })
          .getQuery();
        return "user.id IN " + subQuery;
      })
      .getMany();
    console.log("Users with published posts:", usersWithPublishedPosts.map(u => u.firstName));

    console.log("\n🎉 QueryBuilder demo completed!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log("👋 Connection closed");
  }
}

main();
